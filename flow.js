const messages={
  yes:{heading:'About your Medicare oxygen benefit',body:'Your Medicare oxygen benefit may include portable equipment through your current supplier. This Rove 6 offer is a separate direct purchase and is not billed to Medicare, Medicaid, or insurance. You can check covered options with your supplier before choosing.'},
  no:{heading:'A direct-purchase option',body:'This Rove 6 offer is a direct purchase. Pure Medical does not bill Medicare, Medicaid, or insurance for it. If you want to check your coverage, ask your plan or equipment supplier before buying.'},
  unsure:{heading:'You can check your covered options',body:'Your plan or current oxygen supplier can explain your coverage. This Rove 6 offer is a separate direct purchase and is not billed to Medicare, Medicaid, or insurance.'}
};
export function coverageMessage(answer){return messages[answer]||messages.unsure;}
export function countdownParts(milliseconds){
  const seconds=Math.max(0,Math.floor(milliseconds/1000));
  return {hours:String(Math.floor(seconds/3600)).padStart(2,'0'),minutes:String(Math.floor(seconds%3600/60)).padStart(2,'0'),seconds:String(seconds%60).padStart(2,'0')};
}
export function remainingHold(expiresAt,serverNow,receivedAt,now){return Math.max(0,expiresAt-serverNow-(now-receivedAt));}
