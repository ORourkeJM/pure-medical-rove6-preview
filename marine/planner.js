export function fleetScenario(vessels,kitsPerVessel){
  const count=Number(vessels),kits=Number(kitsPerVessel);
  if(!Number.isInteger(count)||count<1||count>20||![1,2,3,4,5,6,8].includes(kits))throw new RangeError('Choose a supported vessel count and kit quantity.');
  return{vessels:count,kitsPerVessel:kits,requestedKits:count*kits,depositMinor:count*250000};
}
