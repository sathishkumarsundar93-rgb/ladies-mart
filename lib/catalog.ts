export type Spec = [string, string, "s" | "c" | "y" | "n", (string[] | string | number)?, (0 | 1)?, Record<string, string>?];

export const COL: string[] = ["Pink","Purple","Blue","Red","Green","Orange","Yellow","Maroon","Black","White","Grey","Brown","Gold","Cream","Navy","Teal","Peach","Multicolour"];
export const HEX: Record<string, string> = {Pink:"#e0107a",Purple:"#7c3aed",Blue:"#3b82f6",Red:"#e11d2a",Green:"#3f9b4a",Orange:"#f59e0b",Yellow:"#facc15",Maroon:"#7a0a24",Black:"#222",White:"#f4f4f4",Grey:"#9ca3af",Brown:"#8b5a2b",Gold:"#d4a017",Cream:"#f5e6c8",Navy:"#1e3a8a",Teal:"#0f9b8e",Peach:"#ffb48f",Multicolour:"conic-gradient(#e0107a,#f59e0b,#3f9b4a,#3b82f6,#7c3aed,#e0107a)"};
const WASH=["Dry clean only","Hand wash","Machine wash","Gentle machine wash"],PAT=["Solid","Printed","Woven design","Embroidered","Striped","Checked","Floral","Zari work","Abstract"],WORK=["None","Zari","Embroidery","Sequin","Stone work","Mirror work","Block print","Thread work"];
const NECK=["Round","V-neck","Collar","Boat","Square","Keyhole"],SLV=["Sleeveless","Short sleeve","3/4 sleeve","Full sleeve"],FIT=["Regular","Slim","Relaxed"],STITCH=["Stitched","Semi-stitched","Unstitched"];
const FAB=["Cotton","Rayon","Georgette","Silk blend","Linen","Crepe","Chanderi","Polyester","Other"];
export const SPEC: Record<string, Spec[]> = {
Sarees:[["fabric","Saree fabric","s",["Silk","Cotton","Georgette","Chiffon","Crepe","Linen","Net","Organza","Chanderi","Banarasi","Kanjivaram","Other"],1],["color","Primary colour","c",COL,1],["color2","Secondary colour","c",["None",...COL]],["pattern","Saree pattern","s",PAT,1],["border","Border type","s",["No border","Zari border","Contrast border","Woven border","Printed border","Lace border"],1],["blouse","Blouse included","y",0,1],["bfabric","Blouse fabric","s",FAB,1,{blouse:"Yes"}],["bcolor","Blouse colour","c",COL,1,{blouse:"Yes"}],["len","Saree length (metres)","n","5.5",1],["blen","Blouse length (metres)","n","0.8",0,{blouse:"Yes"}],["wid","Saree width (metres)","n","1.1"],["work","Work type","s",WORK,1],["wash","Wash care","s",WASH,1]],
Kurtis:[["fabric","Fabric","s",FAB,1],["color","Primary colour","c",COL,1],["pattern","Pattern","s",PAT,1],["neck","Neck type","s",NECK,1],["sleeve","Sleeve type","s",SLV,1],["length","Kurti length","s",["Short","Knee length","Calf length","Ankle length"],1],["fit","Fit","s",FIT,1],["set","Set includes","s",["Kurti only","Kurti + pant","Kurti + pant + dupatta"],1],["work","Work type","s",WORK],["wash","Wash care","s",WASH,1]],
Dresses:[["fabric","Fabric","s",FAB,1],["color","Primary colour","c",COL,1],["pattern","Pattern","s",PAT,1],["length","Dress length","s",["Mini","Knee length","Midi","Maxi"],1],["neck","Neck type","s",NECK,1],["sleeve","Sleeve type","s",SLV,1],["fit","Fit / style","s",["Fit & flare","A-line","Bodycon","Straight","Wrap"],1],["lining","Lining","y",0,1],["wash","Wash care","s",WASH,1]],
Tops:[["fabric","Fabric","s",FAB,1],["color","Primary colour","c",COL,1],["pattern","Pattern","s",PAT,1],["neck","Neck type","s",NECK,1],["sleeve","Sleeve type","s",SLV,1],["fit","Fit","s",FIT,1],["length","Top length","s",["Crop","Regular","Long"],1],["wash","Wash care","s",WASH,1]],
Jeans:[["fabric","Fabric","s",["Denim","Stretch denim","Cotton blend"],1],["color","Wash colour","c",COL,1],["fit","Fit","s",["Straight","Wide-leg","Skinny","Bootcut","Mom fit"],1],["rise","Rise","s",["Low","Mid","High"],1],["stretch","Stretchable","y",0,1],["length","Length","s",["Ankle length","Full length"],1],["wash","Wash care","s",WASH,1]],
"Ethnic Wear":[["fabric","Top fabric","s",FAB,1],["bottom","Bottom fabric","s",FAB,1],["color","Primary colour","c",COL,1],["dupatta","Dupatta included","y",0,1],["dfabric","Dupatta fabric","s",FAB,1,{dupatta:"Yes"}],["stitch","Stitch type","s",STITCH,1],["work","Work type","s",WORK,1],["wash","Wash care","s",WASH,1]],
Nightwear:[["fabric","Fabric","s",["Cotton","Rayon","Satin","Poly-cotton","Modal"],1],["color","Primary colour","c",COL,1],["pattern","Pattern","s",PAT,1],["sleeve","Sleeve type","s",SLV,1],["fit","Fit","s",FIT,1],["wash","Wash care","s",WASH,1]],
"Dress Material":[["fabric","Top fabric","s",FAB,1],["bottom","Bottom fabric","s",FAB,1],["dfabric","Dupatta fabric","s",FAB,1],["color","Primary colour","c",COL,1],["pattern","Pattern","s",PAT,1],["tlen","Top length (metres)","n","2.5",1],["blen","Bottom length (metres)","n","2.5",1],["dlen","Dupatta length (metres)","n","2.25",1],["work","Work type","s",WORK,1],["wash","Wash care","s",WASH,1]]};
export const SUBCATS: Record<string, string[]> = {Sarees:["Silk","Cotton","Designer","Party wear"],Kurtis:["Straight","A-line","Anarkali","Printed"],Dresses:["Maxi","Midi","Party","Casual"],Tops:["Crop","Casual","Formal"],Jeans:["Straight","Wide-leg","Skinny"],"Ethnic Wear":["Lehenga","Salwar set","Palazzo set"],Nightwear:["Night suit","Gown","Co-ord set"],"Dress Material":["Cotton","Silk","Georgette","Printed"]};
export const PTYPE: Record<string, string[]> = {Sarees:["Saree with blouse piece","Plain saree","Ready-to-wear saree"],Kurtis:["Kurti","Long kurta","Tunic"],Dresses:["Dress","Gown","Jumpsuit"],Tops:["Shirt","Top","T-shirt","Tunic","Crop top"],Jeans:["Jeans","Jeggings","Trousers","Palazzo"],"Ethnic Wear":["Lehenga set","Salwar set","Palazzo set","Sharara set","Gown"],Nightwear:["Night suit","Gown","Co-ord set","Shorts set"],"Dress Material":["Unstitched dress material"]};
export const OCC = ["Daily wear","Office","Festive","Party","Wedding","Casual"];
export const FORM_SIZES = ["XS","S","M","L","XL","XXL"];
export const SLOTS = (c: string): [string, string, number?][] => {
  const s: [string, string, number?][] = [["main", "Main image", 1], ["front", "Front view"], ["back", "Back view"]];
  if (c === "Sarees") s.push(["border", "Border close-up"], ["pallu", "Pallu"], ["blouse", "Blouse piece"]);
  s.push(["fabric", "Fabric close-up"], ["model", "Model wearing"]);
  return s;
};
export const FIXED1 = (c: string) => c=="Sarees"||c=="Dress Material";

export const CATEGORIES = Object.keys(SUBCATS);
export const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];
export const COLOURS = HEX;

// Products with several sizes or any colour need the customer to choose first
export const needsOptions = (p: { sizes?: string[]; colors?: string[] }) =>
  (p.sizes?.length ?? 0) > 1 || (p.colors?.length ?? 0) > 1;
