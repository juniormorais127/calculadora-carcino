import { test, describe } from 'node:test';
import assert from 'node:assert';

describe('tratamento de digitação numérica sem zero na frente', () => {
  const sanitizeNumberInput = (raw) => {
    if (raw === '') return '';
    return raw.replace(/^0+(?=\d)/, '');
  };

  test('remove o zero quando o usuário digita um número após o zero inicial', () => {
    assert.strictEqual(sanitizeNumberInput('05'), '5');
    assert.strictEqual(sanitizeNumberInput('012'), '12');
    assert.strictEqual(sanitizeNumberInput('01000'), '1000');
    assert.strictEqual(sanitizeNumberInput('007'), '7');
  });

  test('preserva o zero isolado e decimais válidos iniciados por zero', () => {
    assert.strictEqual(sanitizeNumberInput('0'), '0');
    assert.strictEqual(sanitizeNumberInput('0.5'), '0.5');
    assert.strictEqual(sanitizeNumberInput('0.05'), '0.05');
    assert.strictEqual(sanitizeNumberInput('0.001'), '0.001');
  });

  test('permite campo vazio durante a limpeza para digitação limpa', () => {
    assert.strictEqual(sanitizeNumberInput(''), '');
  });

  test('mantém números normais sem alteração', () => {
    assert.strictEqual(sanitizeNumberInput('15'), '15');
    assert.strictEqual(sanitizeNumberInput('1000'), '1000');
    assert.strictEqual(sanitizeNumberInput('28.5'), '28.5');
  });
});
