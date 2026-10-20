export const ENVIRONMENTAL_TYPES = { water: 'Água', soil: 'Solo e sedimento', other: 'Outros ensaios' };
export const ENVIRONMENTAL_PARAMETERS = {
  water: [['Temperatura', '°C'], ['Oxigênio dissolvido', 'mg/L'], ['pH', ''], ['Salinidade', 'ppt'], ['Alcalinidade', 'mg/L CaCO3'], ['Amônia total', 'mg/L'], ['Nitrito', 'mg/L'], ['Nitrato', 'mg/L'], ['Transparência', 'cm'], ['Turbidez', 'NTU']],
  soil: [['pH do solo/sedimento', ''], ['Matéria orgânica', '%'], ['Potencial de oxirredução', 'mV'], ['Umidade', '%'], ['Granulometria', ''], ['Sulfetos', 'mg/kg']],
  other: [],
};
export function emptyEnvironmentalTest(type = 'water') { return { type, data: { propertyName: '', pondName: '', sampledOn: new Date().toLocaleDateString('en-CA'), collectedAt: '', samplePoint: '', depth: '', laboratory: '', notes: '', parameters: (ENVIRONMENTAL_PARAMETERS[type] || []).map(([name, unit]) => ({ name, unit, value: '', method: '' })) } }; }
export function validateEnvironmentalTest(input) {
  if (!Object.hasOwn(ENVIRONMENTAL_TYPES, input.type)) throw new Error('Selecione o tipo de análise.');
  const source = input.data || {};
  const data = Object.fromEntries(['propertyName','pondName','sampledOn','collectedAt','samplePoint','depth','laboratory','notes'].map(key => [key, String(source[key] ?? '').trim()]));
  if (!data.propertyName || !/^\d{4}-\d{2}-\d{2}$/.test(data.sampledOn)) throw new Error('Informe a propriedade e a data da coleta.');
  if (!Array.isArray(source.parameters) || source.parameters.length > 100) throw new Error('Use até 100 parâmetros por coleta; crie outra coleta se precisar.');
  data.parameters = source.parameters.map(row => Object.fromEntries(['name','unit','value','method'].map(key => [key, String(row[key] ?? '').trim()]))).filter(row => row.name);
  if (!data.parameters.some(row => row.value)) throw new Error('Informe pelo menos um resultado. Você pode escrever valores, intervalos ou resultados qualitativos.');
  if (JSON.stringify(data).length > 150000) throw new Error('A coleta excede o tamanho permitido. Divida as informações em outra coleta.');
  return { type: input.type, data };
}
