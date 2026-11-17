export const defaults = {city:'New Delhi',aqi:342,sensitive:false,transit:true,remote:false,purifier:false,budget:'low',minutes:60};
export function validate(c) {
 if (!c || typeof c !== 'object') throw Error('Provide household context.');
 if(typeof c.city!=='string'||!c.city.trim()||c.city.length>80) throw Error('Enter a city (1–80 characters).');
 if(!Number.isInteger(c.aqi)||c.aqi<0||c.aqi>500) throw Error('Indian AQI must be a whole number from 0 to 500.');
 if(!Number.isInteger(c.minutes)||c.minutes<0||c.minutes>480) throw Error('Outdoor time must be 0–480 minutes.');
 for(const key of ['sensitive','transit','remote','purifier']) if(typeof c[key]!=='boolean') throw Error('Invalid household option.');
 if(!['low','flexible'].includes(c.budget)) throw Error('Choose a valid budget.');
 return Object.fromEntries(Object.keys(defaults).map(k=>[k,c[k]]));
}
export function category(aqi){return aqi<=50?'Good':aqi<=100?'Satisfactory':aqi<=200?'Moderate':aqi<=300?'Poor':aqi<=400?'Very poor':'Severe';}
export function understand(message, previous){
 if(typeof message!=='string'||message.length>1200||!message.trim()) throw Error('Enter a message of 1–1200 characters.');
 const m=message.toLowerCase(), c={...previous}, changes=[];
 const set=(k,v)=>{c[k]=v;changes.push(k);};
 if(/\b(chest pain|cannot breathe|can't breathe|severe breathlessness)\b/.test(m)) return {context:c,intent:'urgent',changes};
 const readings=[...m.matchAll(/\baqi\s*(?:is|of|=|:)?\s*(\d{1,4})\b/g)].map(x=>Number(x[1]));
 if(new Set(readings).size>1) return {context:c,intent:'conflict',changes:[],question:'You gave different AQI readings. Which current Indian AQI reading should I use?'};
 if(readings.length) set('aqi',readings[0]);
 if(/\b(no children|no vulnerable|no sensitive)\b/.test(m)) set('sensitive',false);
 else if(/\b(child|children|asthma|elderly|pregnant|baby)\b/.test(m)) set('sensitive',true);
 if(/\b(no metro|no transit|no bus)\b/.test(m)) set('transit',false);
 else if(/\b(metro|bus|transit)\b/.test(m)) set('transit',true);
 if(/\b(cannot work from home|can't work from home|must commute)\b/.test(m)) set('remote',false);
 else if(/\b(work from home|remote work)\b/.test(m)) set('remote',true);
 if(/\b(no purifier|cannot afford|can't afford|low budget)\b/.test(m)){set('purifier',false);set('budget','low');}
 else if(/\b(have a purifier|have an air purifier)\b/.test(m)) set('purifier',true);
 const time=m.match(/\b(\d{1,3})\s*minutes?\b/);if(time)set('minutes',Number(time[1]));
 const intent=/\b(why|explain)\b/.test(m)?'explain':/\b(indoor|window|home air|purifier|cooking)\b/.test(m)?'indoor':/\b(commute|travel|school|walk|cycle|routine|plan|smog|air|pollution|aqi)\b/.test(m)||changes.length?'plan':'clarify';
 return {context:validate(c),intent,changes,question:intent==='clarify'?'Would you like help with your commute, indoor air, or an outdoor family routine?':null};
}
export function decide(c,intent='plan'){
 validate(c);
 if(intent==='urgent')return {status:'urgent',title:'Seek urgent medical help',summary:'Severe breathing difficulty or chest pain needs urgent medical assessment. Contact local emergency services now. This assistant cannot diagnose symptoms.',actions:[],tradeoff:'Do not wait for an air-quality plan.',category:category(c.aqi)};
 const elevated=c.aqi>200||(c.sensitive&&c.aqi>100), actions=[];
 const add=(id,title,why,impact)=>actions.push({id,title,why,impact});
 if(c.remote)add('remote','Work from home if your arrangements allow',`Remote work is available in your household; it avoids an otherwise necessary trip.`,'Avoids one commute; no emissions quantity is assumed.');
 else if(elevated&&c.transit)add('transit','Use a shorter outdoor connection to public transport',`AQI ${c.aqi} and ${c.sensitive?'a sensitive household member':'elevated pollution'} make prolonged walking or cycling a poor tradeoff.`,'Can replace a private vehicle trip. Station and vehicle air quality are unknown.');
 else if(elevated)add('essential','Keep essential journeys short; combine errands',`AQI ${c.aqi}; public transport and remote work are unavailable.`,'Fewer separate trips can reduce vehicle use. A vehicle cabin is not guaranteed clean.');
 else add('active','Consider a quieter walking or cycling route',`AQI ${c.aqi} is below this planner’s precaution threshold for your household.`,'Replacing a motorised trip avoids its tailpipe emissions; check current conditions first.');
 if(elevated)add('exercise','Move strenuous exercise indoors',`Indian AQI is ${category(c.aqi).toLowerCase()}${c.sensitive?' and your household includes someone sensitive to pollution':''}.`,'Reduces planned outdoor exertion; actual exposure depends on indoor air.');
 else add('monitor','Check conditions before outdoor activity','A single AQI value cannot identify a safe hour or street.','Avoids relying on an invented forecast. Stop activity if symptoms develop.');
 if(c.purifier)add('filter','Run an appropriately sized particle air cleaner', 'Your household already has a purifier. Follow its filter and room-size instructions; avoid ozone generators.','Filtration can reduce particles; it does not remove every gas or replace source control.');
 else add('sources','Start with no-cost indoor source control',`No purifier is available${c.budget==='low'?' and your budget is limited':''}. Avoid incense, candles and smoking; damp-dust rather than dry-sweep.`,'Prevents avoidable indoor particle sources without requiring a purchase.');
 add('ventilation','Ventilate with care, rather than sealing indefinitely','When outdoor particle pollution is high, limit unnecessary openings. Cooking fumes, overheating, gas leaks and stale indoor air still need attention.','Use cooking extraction where available. Ventilate when outdoor air improves; never block required combustion ventilation.');
 return {status:elevated?'caution':'planned',category:category(c.aqi),title:elevated?'Less exposure. A more practical day.':'A lighter footprint, with conditions in view.',summary:`A plan for ${c.city}, using your supplied Indian AQI of ${c.aqi}. ${c.sensitive?'Sensitive household precautions are active.':'General household precautions are active.'}`,actions:intent==='indoor'?actions.filter(a=>['filter','sources','ventilation'].includes(a.id)):actions,tradeoff:elevated?'Exposure precautions take priority over walking or cycling to cut emissions.':'Low-emission choices remain conditional on local conditions and how you feel.',missing:['No live monitoring or forecast is connected.','Indoor air and route conditions have not been measured.'],outdoorMinutes:c.minutes};
}
export function respond(message,context){const parsed=understand(message,validate(context));return {...parsed,decision:parsed.question?null:decide(parsed.context,parsed.intent)};}
