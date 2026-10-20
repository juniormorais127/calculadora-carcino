import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { LICENSING_SECTIONS, missingLicensingFields } from './licensingData.js';

const files = { request:'requerimento.pdf', power:'procuracao.pdf', tra:'tra-ls.pdf', rce:'rce-ls.pdf' };
const address = (data,prefix) => [data[`${prefix}Street`],data[`${prefix}District`],data[`${prefix}City`],data[`${prefix}State`],data[`${prefix}Zip`]].filter(Boolean).join(', ');
const dateParts = date => date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? [date.slice(8,10), date.slice(5,7), date.slice(0,4)] : ['','',''];
export async function createLicensingPdf(kind, data, templateBytes, fontBytes) {
  if (!files[kind]) throw new Error('Modelo inválido.');
  if (['tra','rce'].includes(kind) && data.licenseType !== 'LS') throw new Error('Este modelo oficial é específico de Licença Simplificada.');
  const pdf = await PDFDocument.load(templateBytes);
  pdf.registerFontkit(fontkit);
  const font = fontBytes ? await pdf.embedFont(fontBytes, { subset:true }) : await pdf.embedFont(StandardFonts.Helvetica);
  const form = pdf.getForm();
  const fit = (text,width,height,size=9) => {
    const lines = String(text).split('\n');
    while (size>6 && (Math.max(...lines.map(line=>font.widthOfTextAtSize(line,size)))>width-4 || lines.length*size*1.2>height-3)) size-=0.25;
    return size;
  };
  const field = (pageIndex,key,value,x,top,width,height=16,options={}) => {
    if (!String(value ?? '').trim()) return;
    const page=pdf.getPages()[pageIndex];
    const control=form.createTextField(`carcino.${kind}.${key}`);
    control.setText(String(value)); if(height>23)control.enableMultiline();
    if(options.erase)page.drawRectangle({x,y:page.getHeight()-top-height,width,height,color:rgb(1,1,1)});
    control.addToPage(page,{x,y:page.getHeight()-top-height,width,height,borderWidth:0,backgroundColor:undefined,font,textColor:rgb(0.02,0.12,0.2)});
    control.setFontSize(fit(value,width,height));
  };
  if(kind==='request') {
    const values={Text1:data.clientName,Text2:data.clientDocument,Text3:data.clientStreet,Text4:data.clientZip,Text5:data.clientDistrict,Text6:data.clientCity,Text7:data.clientState,Text8:['RLI','RLO'].includes(data.licenseType)?data.licenseType:'',Text23:[data.activity,data.propertyName].filter(Boolean).join(' — '),Text24:data.propertyStreet,Text25:data.propertyDistrict,Text26:data.propertyCity,Text27:data.propertyState,Text28:data.propertyZip,Text29:[data.utmZone&&`Zona ${data.utmZone}`,data.utmEasting&&`E ${data.utmEasting} m`,data.utmNorthing&&`N ${data.utmNorthing} m`].filter(Boolean).join(' · '),Text40:data.requestDescription,Text41:data.contactName,Text42:data.contactCpf,Text43:data.contactAddress,Text44:data.contactDistrict,Text45:data.contactCity,Text46:data.contactState,Text47:data.contactZip,Text48:data.contactPhone,Text49:data.contactLandline,Text50:data.contactEmail,Text51:data.legalName||data.clientName,Text52:data.legalPosition,Text53:data.legalCpf||data.clientDocument};
    const [day,month,year]=dateParts(data.signedDate);Object.assign(values,{Text54:day,Text55:month,Text56:year});
    field(1,'signedCity',data.signedCity,300,638,126,20,{erase:true});
    const selected={LP:'Text9',LI:'Text10',LO:'Text11',LS:'Text12',LRO:'Text17',RLI:'Text22',RLO:'Text22'}[data.licenseType];if(selected)values[selected]='X';
    for(const [name,value]of Object.entries(values))if(value){const text=form.getTextField(name);text.setText(String(value));if(name==='Text40')text.enableMultiline();const widget=text.acroField.getWidgets()[0];const box=widget.getRectangle();text.setFontSize(fit(value,box.width,box.height));}
    // Do not select unknown yes/no answers or fill fields reserved to ADEMA.
    field(1,'previous-details',[data.previousLicense,data.otherProcess,data.environmentalDebt].filter(Boolean).join('\n'),112,193,424,25);
  }
  if(kind==='power') {
    for(const [prefix,offset]of [['client',0],['technician',152]]) {
      for(const [suffix,x,y,w]of [['Name',168,408,374],['CivilStatus',123,423,90],['Profession',282,423,89],['Position',410,423,130],['Company',110,437,100],['Document',282,437,258],['Street',120,465,420],['District',101,479,110],['Zip',245,479,120],['Complement',437,479,104],['City',115,493,95],['State',240,493,100],['Phone',427,493,112],['Email',90,507,450]]) {
        const key=prefix+suffix; const value=prefix==='technician'&&suffix==='Document'?data.technicianCpf:data[key];field(0,key,value,x,y+offset,w,13);
      }
    }
    field(1,'property',[data.propertyName,data.activity].filter(Boolean).join(' — '),210,145,332,25);
    field(1,'street',data.propertyStreet,122,181,236,14);field(1,'district',data.propertyDistrict,410,181,132,14);
    field(1,'zip',data.propertyZip,85,214,122,14);field(1,'city',data.propertyCity,280,214,77,14);field(1,'state',data.propertyState,389,214,150,14,{erase:true});field(1,'phone',data.propertyPhone||data.clientPhone,111,229,429,14);field(1,'stateRegistration',data.stateRegistration,158,243,51,14);field(1,'document',data.propertyDocument,283,243,257,14);
    field(1,'signedPlaceAndDate',[data.signedCity,data.signedDate].filter(Boolean).join(' — '),184,332,355,16,{erase:true});
  }
  if(kind==='tra') {
    field(0,'legalName',data.legalName||data.clientName,80,144,325,17);field(0,'legalCpf',data.legalCpf||data.clientDocument,441,144,115,17);field(0,'secondName',data.secondLegalName,80,171,324,17);field(0,'secondCpf',data.secondLegalCpf,441,171,115,17);
    field(0,'propertyName',data.propertyName,209,198,328,17);field(0,'enterprise',data.propertyName,358,253,197,16);field(0,'address',address(data,'property'),252,272,302,16);field(0,'activity',data.activity,265,290,289,16);
    field(0,'signedDate',[data.signedCity,data.signedDate].filter(Boolean).join(' — '),139,606,317,17,{erase:true});
  }
  if(kind==='rce') {
    for(const[key,y,h]of [['propertyName',435,18],['propertyDocument',455,18],['propertyPhone',573,18],['propertyEmail',594,18],['annualRevenue',614,18],['employees',635,18]])field(0,key,data[key],235,y,315,h);
    field(0,'car',data.car,323,493,224,18);field(0,'address',address(data,'property'),235,534,315,38,{erase:true});
    for(const[key,y,h]of [['clientName',190,37],['clientDocument',230,18],['clientPhone',271,18],['clientEmail',291,18],['technicianName',375,18],['technicianFormation',395,18],['technicianCouncil',415,18],['technicianPhone',436,18],['technicianEmail',456,18]])field(1,key,data[key],243,y,305,h);
    field(1,'clientAddress',address(data,'client'),242,251,306,18,{erase:true});field(1,'technicianAddress',address(data,'technician'),242,477,306,18,{erase:true});
    field(1,'totalArea',data.totalArea,196,556,352,18);field(1,'usefulArea',data.usefulArea,196,578,352,18);
    field(1,'utmZone',data.utmZone,240,607,90,17);field(1,'utmE',data.utmEasting,235,630,145,18);field(1,'utmN',data.utmNorthing,412,630,131,18);
  }
  // Every entered value also appears in a readable, paginated attachment. This
  // preserves long content without silently squeezing it into a tiny model box.
  let page, y;
  const newPage=()=>{page=pdf.addPage([595.28,841.89]);y=788;page.drawText('CarcinoGestão · Dados para revisão do documento',{x:42,y,size:13,font,color:rgb(0.02,0.3,0.25)});y-=25;page.drawText('Preparação documental — não é licença nem comprovante oficial emitido pela Adema.',{x:42,y,size:8,font});y-=25;};
  const line=(text,size=9)=>{const chunks=[];for(const word of String(text).split(/\s+/)){let piece='';for(const char of word){if(font.widthOfTextAtSize(piece+char,size)>505){chunks.push(piece);piece='';}piece+=char;}if(piece)chunks.push(piece);}let current='';const print=()=>{if(y<48)newPage();page.drawText(current,{x:42,y,size,font});y-=14;};for(const word of chunks){if(font.widthOfTextAtSize(`${current} ${word}`,size)>510&&current){print();current=word;}else current=current?`${current} ${word}`:word;}if(current)print();};
  newPage();
  line(`${missingLicensingFields(data).length} campos-base ainda pendentes. Conferir modelo completo, enquadramento, anexos e assinaturas antes do protocolo.`);y-=10;
  for(const section of LICENSING_SECTIONS){if(y<90)newPage();line(section.label,11);for(const item of section.fields){const value=String(data[item.id]||'').trim();if(value){line(`${item.label}: ${value}`);}else if(item.required){line(`${item.label}: PENDENTE`,8);}}y-=12;}
  form.updateFieldAppearances(font);
  pdf.setTitle(`Preparação documental Adema — ${data.propertyName||'rascunho'}`);pdf.setAuthor('CarcinoGestão');pdf.setSubject('Modelo para revisão e assinatura; sem emissão oficial de licença ou protocolo.');
  return pdf.save();
}
export async function downloadLicensingDocument(kind,data) {
  const base=import.meta.env.BASE_URL;
  const [template,font]=await Promise.all([fetch(`${base}adema/${files[kind]}`),fetch(`${base}fonts/NotoSans-Regular.ttf`)]);
  if(!template.ok||!font.ok)throw new Error('Não foi possível carregar o modelo oficial ou a fonte. Confira a conexão.');
  const bytes=await createLicensingPdf(kind,data,await template.arrayBuffer(),await font.arrayBuffer());
  const {saveDeviceFile}=await import('./deviceFiles.js');
  await saveDeviceFile(new Blob([bytes],{type:'application/pdf'}),`adema-${kind}-${data.propertyName||'rascunho'}.pdf`);
}
