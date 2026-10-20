import React from 'react';

export default class ScreenBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error, info) { console.error('Falha ao abrir tela do CarcinoGestão:', error, info.componentStack); }
  render() {
    if (!this.state.failed) return this.props.children;
    return <section role="alert" className="mx-auto my-8 max-w-lg space-y-4 rounded-xl border border-rose-300 bg-rose-50 p-5 text-slate-900">
      <h2 className="text-xl font-bold">Não foi possível abrir esta tela</h2>
      <p className="text-sm">Ocorreu uma falha ao exibir o conteúdo. Seus registros foram preservados. Tente novamente ou use o menu para abrir outra seção.</p>
      <button type="button" className="min-h-12 rounded-xl bg-emerald-800 px-4 py-3 font-semibold text-white" onClick={() => this.setState({ failed: false })}>Tentar abrir novamente</button>
    </section>;
  }
}
