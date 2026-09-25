const sbReady = window.SUPABASE_URL.startsWith("https://") && !window.SUPABASE_ANON_KEY.startsWith("PASTE_");
const supabaseClient = sbReady ? supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY) : null;

const services = [
  ["🔌","Electrician","Wiring, fan, switch, appliance work"],
  ["🚰","Plumber","Pipes, taps, leakage, bathroom"],
  ["🧱","Mason / Mistri","Construction, repair, plaster"],
  ["👷","Labour","Loading, shifting, general work"],
  ["🧹","Cleaning","Home, office and deep cleaning"],
  ["🚽","Toilet Cleaner","Bathroom and toilet cleaning"],
  ["🪚","Carpenter","Furniture, doors, wood work"],
  ["🎨","Painter","Wall, house and commercial painting"],
  ["🚗","Car Mechanic","Car repair and roadside help"],
  ["🏍️","Bike Mechanic","Bike service and repair"],
  ["❄️","AC Technician","AC service, repair and installation"],
  ["📱","Appliance Repair","TV, fridge, washing machine etc."],
  ["🏠","RO Technician","RO/water purifier service"],
  ["🔧","Welder","Gate, grill and metal welding"],
  ["🌿","Gardener","Garden and plant maintenance"],
  ["🪟","Glass Worker","Glass, window and fitting work"],
  ["📦","Packers & Movers","Packing, loading and shifting"],
  ["🛠️","Other Services","More local services"]
];

const $ = id => document.getElementById(id);
let selectedMode = "login";
let currentUser = null;
let currentProfile = null;
let userLat = null, userLng = null;

function toast(msg, type="notice"){
  const old=document.querySelector(".toast"); if(old) old.remove();
  const d=document.createElement("div"); d.className="toast "+type; d.textContent=msg;
  Object.assign(d.style,{position:"fixed",bottom:"20px",right:"20px",zIndex:99,maxWidth:"360px",padding:"13px 16px",borderRadius:"10px",boxShadow:"0 10px 30px #0002",background:type==="success"?"#dcfce7":"#eff6ff",color:type==="success"?"#166534":"#1e40af",fontWeight:"700"});
  document.body.appendChild(d); setTimeout(()=>d.remove(),4500);
}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

function renderServices(){
  $("serviceGrid").innerHTML=services.map((s,i)=>`<div class="service-card" onclick="chooseService('${i}')"><div class="service-icon">${s[0]}</div><h3>${s[1]}</h3><p>${s[2]}</p></div>`).join("");
  $("homeService").innerHTML='<option value="">Select a service</option>'+services.map((s,i)=>`<option value="${i}">${s[0]} ${s[1]}</option>`).join("");
}
function chooseService(i){$("homeService").value=i; document.querySelector("#homeService").scrollIntoView({behavior:"smooth"});}

function authUI(){
  $("authForm").innerHTML = selectedMode==="login" ? `
    <h2>Welcome back</h2><p class="provider-meta">Login with your registered email. Phone OTP can be enabled after Supabase SMS setup.</p>
    <div class="field"><label>Email</label><input id="loginEmail" type="email" placeholder="you@example.com"></div>
    <button class="btn full" onclick="loginEmail()">Send Login Link</button>
    <div class="notice" style="margin-top:12px">For mobile OTP login, use the phone OTP section below after configuring an SMS provider in Supabase.</div>
    <div class="field"><label>Mobile number</label><input id="loginPhone" placeholder="+91XXXXXXXXXX"></div>
    <button class="btn ghost full" onclick="loginPhone()">Send Mobile OTP</button>
  ` : `
    <h2>Create account</h2><p class="provider-meta">Choose whether you are a customer or a service provider.</p>
    <div class="field"><label>Account type</label><select id="role"><option value="customer">Customer</option><option value="provider">Service Provider</option></select></div>
    <div class="form-row"><div class="field"><label>Full name</label><input id="regName"></div><div class="field"><label>Mobile</label><input id="regPhone" placeholder="+91XXXXXXXXXX"></div></div>
    <div class="field"><label>Email</label><input id="regEmail" type="email" placeholder="you@example.com"></div>
    <div class="field"><label>Address</label><textarea id="regAddress" rows="2" placeholder="Area, city, district"></textarea></div>
    <div id="providerFields"></div>
    <div class="notice">Location permission will be requested only when you click the location button. Full Aadhaar number is intentionally not stored; providers can enter masked/last-4 information for admin verification.</div>
    <button class="btn full" onclick="registerAccount()">Create Account</button>
  `;
  const role=$("role"); if(role) role.onchange=()=>renderRoleFields(role.value);
  if(role) renderRoleFields(role.value);
}
function renderRoleFields(role){
  if(!$("providerFields")) return;
  $("providerFields").innerHTML = role==="provider" ? `
    <div class="field"><label>Services / expertise (select all)</label>
      <div class="checks">${services.map((s,i)=>`<label class="check"><input type="checkbox" name="expert" value="${i}"> ${s[0]} ${s[1]}</label>`).join("")}</div>
    </div>
    <div class="form-row"><div class="field"><label>Experience (years)</label><input id="experience" type="number" min="0"></div>
    <div class="field"><label>Aadhaar last 4 digits (optional)</label><input id="aadhaarLast4" maxlength="4" inputmode="numeric"></div></div>
  ` : `
    <div class="field"><label>Problem photo/video (optional)</label><input id="problemMedia" type="file" accept="image/*,video/*" multiple></div>
  `;
}

async function registerAccount(){
  if(!sbReady){toast("First add your Supabase URL and anon key in js/config.js.","danger");return}
  const role=$("role").value, name=$("regName").value.trim(), phone=$("regPhone").value.trim(), email=$("regEmail").value.trim(), address=$("regAddress").value.trim();
  if(!name||!phone||!email||!address){toast("Name, mobile, email and address are required.","danger");return}
  const {data,error}=await supabaseClient.auth.signUp({email,password:crypto.randomUUID()+"Aa1!",options:{data:{full_name:name,role,phone}}});
  if(error){toast(error.message,"danger");return}
  const uid=data.user.id;
  let lat=null,lng=null;
  if(navigator.geolocation) await new Promise(resolve=>navigator.geolocation.getCurrentPosition(p=>{lat=p.coords.latitude;lng=p.coords.longitude;resolve()},()=>resolve(),{enableHighAccuracy:true,timeout:8000}));
  const profile={id:uid,role,full_name:name,phone,email,address,latitude:lat,longitude:lng};
  if(role==="provider"){
    profile.experience_years=Number($("experience")?.value||0);
    profile.aadhaar_last4=$("aadhaarLast4")?.value||null;
    profile.verification_status="pending";
  }
  const {error:pe}=await supabaseClient.from("profiles").upsert(profile);
  if(pe){toast(pe.message,"danger");return}
  if(role==="provider"){
    const ids=[...document.querySelectorAll('input[name="expert"]:checked')].map(x=>Number(x.value));
    for(const idx of ids){
      const svc=services[idx];
      const {data:sd}=await supabaseClient.from("services").select("id").eq("name",svc[1]).maybeSingle();
      if(sd) await supabaseClient.from("provider_services").upsert({provider_id:uid,service_id:sd.id});
    }
  }
  toast("Account created. Check your email to confirm it, then login.","success");
  $("authModal").classList.add("hidden");
}

async function loginEmail(){
  if(!sbReady){toast("Add Supabase settings first.","danger");return}
  const email=$("loginEmail").value.trim(); if(!email)return toast("Enter email.","danger");
  const {error}=await supabaseClient.auth.signInWithOtp({email,options:{emailRedirectTo:location.href}});
  if(error) toast(error.message,"danger"); else toast("Login link sent to your email.","success");
}
async function loginPhone(){
  if(!sbReady){toast("Add Supabase settings first.","danger");return}
  const phone=$("loginPhone").value.trim(); if(!phone)return toast("Enter mobile number.","danger");
  const {error}=await supabaseClient.auth.signInWithOtp({phone});
  if(error) toast(error.message,"danger"); else showOtp(phone);
}
function showOtp(phone){
  $("authForm").insertAdjacentHTML("beforeend",`<div class="field" style="margin-top:15px"><label>OTP</label><input id="otp" inputmode="numeric" placeholder="6 digit OTP"></div><button class="btn full" onclick="verifyOtp('${esc(phone)}')">Verify OTP</button>`);
}
async function verifyOtp(phone){
  const token=$("otp").value.trim(); const {data,error}=await supabaseClient.auth.verifyOtp({phone,token,type:"sms"});
  if(error) toast(error.message,"danger"); else {toast("Login successful.","success"); $("authModal").classList.add("hidden"); await loadUser(); openDashboard();}
}

async function loadUser(){
  if(!supabaseClient)return;
  const {data}=await supabaseClient.auth.getUser(); currentUser=data.user;
  if(currentUser){const {data:p}=await supabaseClient.from("profiles").select("*").eq("id",currentUser.id).maybeSingle();currentProfile=p}
}
async function openDashboard(){
  await loadUser(); if(!currentUser){$("authModal").classList.remove("hidden");return}
  $("dashboardModal").classList.remove("hidden");
  if(currentProfile?.role==="admin") renderAdmin(); else if(currentProfile?.role==="provider") renderProvider(); else renderCustomer();
}
function renderCustomer(){
  $("dashboard").innerHTML=`<p class="eyebrow">Customer account</p><h2>Hello, ${esc(currentProfile?.full_name||"Customer")}</h2>
  <div class="dash-box"><h3>My profile</h3><p class="provider-meta">${esc(currentProfile?.phone||"")} · ${esc(currentProfile?.address||"")}</p></div>
  <div class="dash-box"><h3>Book a service</h3><p class="provider-meta">Choose a service on the home page and use your location to find nearby providers.</p><button class="btn" onclick="$('dashboardModal').classList.add('hidden');document.querySelector('#home').scrollIntoView()">Find Provider</button></div>
  <button class="btn ghost" onclick="logout()">Logout</button>`;
}
function renderProvider(){
  $("dashboard").innerHTML=`<p class="eyebrow">Service provider</p><h2>${esc(currentProfile?.full_name||"Provider")}</h2>
  <div class="dash-box"><h3>Verification</h3><p class="provider-meta">Status: <b>${esc(currentProfile?.verification_status||"pending")}</b>. Admin can approve your profile.</p>
  <p>Experience: ${esc(currentProfile?.experience_years||0)} years · Aadhaar: ${currentProfile?.aadhaar_last4?"****"+esc(currentProfile.aadhaar_last4):"Not provided"}</p></div>
  <div class="dash-box"><h3>Your selected expertise</h3><div id="myExpertise">Loading...</div></div>
  <button class="btn ghost" onclick="logout()">Logout</button>`;
  loadMyExpertise();
}
async function loadMyExpertise(){
  const {data}=await supabaseClient.from("provider_services").select("services(name,icon)").eq("provider_id",currentUser.id);
  $("myExpertise").innerHTML=(data||[]).map(x=>`<span class="badge" style="margin:3px">${esc(x.services?.icon||"")} ${esc(x.services?.name||"")}</span>`).join("")||"No services selected";
}
async function renderAdmin(){
  $("dashboard").innerHTML=`<p class="eyebrow">Administrator</p><h2>Admin Control Center</h2>
  <div class="dash-nav"><button onclick="adminProviders()">Providers</button><button onclick="adminUsers()">Users</button><button onclick="adminRequests()">Requests</button><button onclick="adminServices()">Services</button><button class="btn ghost" onclick="logout()">Logout</button></div>
  <div id="adminArea" class="dash-box">Choose a section.</div>`;
}
async function adminProviders(){
  const {data,error}=await supabaseClient.from("profiles").select("*").eq("role","provider").order("created_at",{ascending:false});
  $("adminArea").innerHTML=error?`<div class="notice danger">${esc(error.message)}</div>`:`<h3>Providers</h3><div class="list">${(data||[]).map(p=>`<div class="list-item"><div><b>${esc(p.full_name)}</b><div class="provider-meta">${esc(p.phone)} · ${esc(p.address)}<br>Status: ${esc(p.verification_status||"pending")}</div></div><button class="btn" onclick="approveProvider('${p.id}')">Approve</button></div>`).join("")||"No providers yet."}</div>`;
}
async function approveProvider(id){const {error}=await supabaseClient.from("profiles").update({verification_status:"approved"}).eq("id",id);if(error)toast(error.message,"danger");else{toast("Provider approved.","success");adminProviders()}}
async function adminUsers(){
  const {data,error}=await supabaseClient.from("profiles").select("id,role,full_name,phone,email,address,created_at").order("created_at",{ascending:false});
  $("adminArea").innerHTML=error?`<div class="notice danger">${esc(error.message)}</div>`:`<h3>All Profiles</h3><div class="list">${(data||[]).map(p=>`<div class="list-item"><div><b>${esc(p.full_name)}</b> <span class="badge">${esc(p.role)}</span><div class="provider-meta">${esc(p.email||"")} · ${esc(p.phone||"")} · ${esc(p.address||"")}</div></div></div>`).join("")}</div>`;
}
async function adminRequests(){
  const {data,error}=await supabaseClient.from("service_requests").select("*,profiles!service_requests_customer_id_fkey(full_name,phone),services(name)").order("created_at",{ascending:false});
  $("adminArea").innerHTML=error?`<div class="notice danger">${esc(error.message)}</div>`:`<h3>Service Requests</h3><div class="list">${(data||[]).map(r=>`<div class="list-item"><div><b>${esc(r.services?.name||"Service")}</b><div class="provider-meta">Customer: ${esc(r.profiles?.full_name||"")} · ${esc(r.profiles?.phone||"")}<br>Status: ${esc(r.status)}</div></div></div>`).join("")||"No requests yet."}</div>`;
}
async function adminServices(){
  const {data,error}=await supabaseClient.from("services").select("*").order("name");
  $("adminArea").innerHTML=error?`<div class="notice danger">${esc(error.message)}</div>`:`<h3>Service Categories</h3><div class="list">${(data||[]).map(s=>`<div class="list-item"><b>${esc(s.icon)} ${esc(s.name)}</b><span>${esc(s.description||"")}</span></div>`).join("")}</div>`;
}

async function findProviders(){
  const idx=$("homeService").value;if(idx==="")return toast("Select a service first.","danger");
  if(userLat===null||userLng===null)return toast("Use your current location first.","danger");
  if(!sbReady)return toast("Add Supabase settings first.","danger");
  const serviceName=services[Number(idx)][1];
  const {data:s}=await supabaseClient.from("services").select("id").eq("name",serviceName).maybeSingle();
  if(!s)return toast("Service not found. Run the SQL setup.","danger");
  const {data,error}=await supabaseClient.rpc("find_nearby_providers",{p_service_id:s.id,p_lat:userLat,p_lng:userLng,p_radius_km:25});
  $("providerResults").innerHTML=error?`<div class="empty">${esc(error.message)}</div>`:(data||[]).map(p=>`<div class="provider-card"><span class="badge">${p.verification_status==="approved"?"Verified":"Pending"}</span><h3>${esc(p.full_name)}</h3><div class="provider-meta">⭐ ${Number(p.rating_avg||0).toFixed(1)} · ${Number(p.distance_km||0).toFixed(1)} km away<br>${esc(p.address||"Address not available")}<br>Experience: ${esc(p.experience_years||0)} years</div><button class="btn full" onclick="requestService('${p.provider_id}','${s.id}')">Request Service</button></div>`).join("")||`<div class="empty">No nearby provider found within 25 km.</div>`;
}
async function requestService(providerId,serviceId){
  if(!currentUser){toast("Please login as a customer first.","danger");$("authModal").classList.remove("hidden");return}
  if(currentProfile?.role!=="customer")return toast("Only customer accounts can book services.","danger");
  const {error}=await supabaseClient.from("service_requests").insert({customer_id:currentUser.id,provider_id:providerId,service_id:serviceId,customer_latitude:userLat,customer_longitude:userLng,status:"pending"});
  if(error)toast(error.message,"danger");else toast("Service request sent.","success");
}
function getLocation(){
  if(!navigator.geolocation)return toast("Geolocation is not supported.","danger");
  $("locStatus").textContent="Requesting location permission...";
  navigator.geolocation.getCurrentPosition(p=>{userLat=p.coords.latitude;userLng=p.coords.longitude;$("locStatus").textContent="Location ready. Nearby providers will be searched first.";toast("Location captured.","success")},e=>{ $("locStatus").textContent="Location permission was not granted.";toast("Please allow location permission.","danger")},{enableHighAccuracy:true,timeout:10000});
}
async function logout(){if(supabaseClient)await supabaseClient.auth.signOut();currentUser=null;currentProfile=null;$("dashboardModal").classList.add("hidden");toast("Logged out.","success")}
$("locateBtn").onclick=getLocation;$("findBtn").onclick=findProviders;
$("loginBtn").onclick=()=>{selectedMode="login";authUI();$("authModal").classList.remove("hidden")};
$("registerBtn").onclick=()=>{selectedMode="register";authUI();$("authModal").classList.remove("hidden")};
$("heroRegister").onclick=()=>{$("registerBtn").click()};
$("closeAuth").onclick=()=>$("authModal").classList.add("hidden");$("closeDash").onclick=()=>$("dashboardModal").classList.add("hidden");
document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>{selectedMode=t.dataset.mode;document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));t.classList.add("active");authUI()});
$("careBtn").onclick=()=>toast("Add your customer-care email/phone in this button when launching.","success");
$("youtubeLink").href=window.SOCIAL_LINKS.youtube;$("instagramLink").href=window.SOCIAL_LINKS.instagram;$("xLink").href=window.SOCIAL_LINKS.x;$("facebookLink").href=window.SOCIAL_LINKS.facebook;
renderServices();
if(supabaseClient){supabaseClient.auth.onAuthStateChange(()=>loadUser());loadUser()}
