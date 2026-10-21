import { test, expect } from '@playwright/test';

test('ajuda técnica abre por clique e teclado sem navegar nem cobrir os serviços', async ({ page }, testInfo) => {
  await page.goto('./');
  await page.evaluate(async()=>{
    const React=(await import('/node_modules/.vite/deps/react.js')).default;
    const {createRoot}=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const {default:Topics}=await import('/src/components/TechnicalTopics.jsx');
    document.getElementById('root').style.display='none';
    const host=document.createElement('main');host.id='technical-help';host.className='mx-auto max-w-4xl p-4';document.body.append(host);
    window.selectedTechnicalTopic=null;
    createRoot(host).render(React.createElement(Topics,{onNavigate:id=>{window.selectedTechnicalTopic=id;}}));
  });
  const host=page.locator('#technical-help');
  const info=host.getByRole('button',{name:'Informações: Monitoramento ambiental',exact:true});
  const explanation=host.getByText('Água, solo e outros testes da propriedade.',{exact:true});
  for(const width of [320,426,1440]) {
    await page.setViewportSize({width,height:900});
    await expect(explanation).toBeHidden();
    await info.focus();await page.keyboard.press('Enter');
    await expect(info).toHaveAttribute('aria-expanded','true');await expect(explanation).toBeVisible();
    expect(await page.evaluate(()=>window.selectedTechnicalTopic)).toBeNull();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:testInfo.outputPath(`help-${width}.png`),fullPage:true});
    await page.keyboard.press('Escape');await expect(explanation).toBeHidden();await expect(info).toBeFocused();
    await info.click();await host.getByRole('button',{name:'Fechar informações: Monitoramento ambiental',exact:true}).click();
    await expect(explanation).toBeHidden();await expect(info).toBeFocused();
  }
  await host.getByRole('button',{name:'Monitoramento ambiental',exact:true}).click();
  expect(await page.evaluate(()=>window.selectedTechnicalTopic)).toBe('environment');
});
