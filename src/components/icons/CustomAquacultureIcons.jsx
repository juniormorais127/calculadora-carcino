import React from "react";

/**
 * CustomAquacultureIcons
 * Conjunto de ícones vetoriais SVG de alta precisão dedicados à carcinicultura e aquicultura.
 * Desenvolvidos com proporções anatômicas e técnicas, 100% compatíveis com Lucide-React e Tailwind CSS.
 */

/**
 * ShrimpIcon
 * Silhueta anatômica e refinada de camarão (Litopenaeus vannamei).
 * Apresenta rostro serrilhado, longas antenas encurvadas sobre o dorso,
 * cefalotórax com olho demarcado, pereiópodes, 6 somitos abdominais arqueados,
 * pleiópodes (apêndices natatórios) e leque caudal (telson e urópodes).
 */
export function ShrimpIcon({ className = "w-6 h-6", size, strokeWidth = 1.8, ...props }) {
  const dimensionProps = size ? { width: size, height: size } : {};

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...dimensionProps}
      {...props}
    >
      {/* Antena sensorial principal longa arqueando sobre o corpo */}
      <path d="M7 8.5C9.5 4 14.5 2 21 3.5" />
      {/* Antênula secundária */}
      <path d="M6.5 7.5C8.5 5 12 4.5 15.5 5.5" />

      {/* Rostro serrilhado (Litopenaeus vannamei) */}
      <path d="M2.5 6.5L4 7.2L5 6.2L6 7.5L7 8" />

      {/* Olho do camarão */}
      <circle cx="6.8" cy="9.2" r="0.75" fill="currentColor" stroke="none" />

      {/* Carapaça (Cefalotórax) */}
      <path d="M7 8C9 8.2 10.5 8.8 11.5 10C10 11.2 8.5 12.2 7.2 12C6.5 11.2 6.4 9.5 7 8Z" />

      {/* Pereiópodes (patas marchadeiras/torácicas) */}
      <path d="M7.8 12.2L7 14.5L8.2 15.2" />
      <path d="M9.2 12.3L8.8 15L10 15.5" />

      {/* Abdômen segmentado (6 somitos arqueados) */}
      {/* Contorno dorsal contínuo do abdômen */}
      <path d="M11.5 10C14 10.5 16.5 12 18.5 14.2C19.5 15.5 20 17 19.2 18.5C18.5 19.8 17 20.8 15.2 21.2" />

      {/* Contorno ventral do abdômen */}
      <path d="M10 12.5C11.5 12.8 13.5 13.5 15 15C16.2 16.2 16.2 17.5 15.2 18.8L14 19.5" />

      {/* Divisões anatômicas dos segmentos abdominais (somitos) */}
      <path d="M13.8 10.6C13.2 12 12.5 13.2 11.8 13.5" />
      <path d="M16.5 12.2C15.5 13.5 14.8 14.8 14.2 15.5" />
      <path d="M18.5 14.8C17.2 16 16.5 17 15.8 18" />

      {/* Pleiópodes (apêndices natatórios ventrais) */}
      <path d="M12.5 13.8L11.8 15.5" />
      <path d="M14.5 15.6L13.8 17.2" />

      {/* Leque caudal (Telson agudo no centro e urópodes laterais) */}
      <path d="M15.2 21.2L12 21.5" />
      <path d="M14.8 20.2C13.5 19.5 11.5 19.8 10.5 20.2" />
      <path d="M14.5 21.5C13.2 22.5 11.2 22.8 10 22.2" />
    </svg>
  );
}

/**
 * FeedTrayIcon
 * Bandeja de alimentação aquícola / comedouro de arraçoamento suspenso com ração peletizada.
 * Representa a bandeja de checagem usada pelos carcinicultores para avaliar consumo e FCA.
 */
export function FeedTrayIcon({ className = "w-6 h-6", size, strokeWidth = 1.8, ...props }) {
  const dimensionProps = size ? { width: size, height: size } : {};

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...dimensionProps}
      {...props}
    >
      {/* Argola / olhal superior de içamento */}
      <circle cx="12" cy="3.5" r="1.5" />

      {/* Cabos / tirantes de suspensão convergentes */}
      <path d="M12 5L4.5 13" />
      <path d="M12 5L12 14.5" />
      <path d="M12 5L19.5 13" />

      {/* Borda superior da bandeja (aro elíptico de tela/malha) */}
      <ellipse cx="12" cy="14" rx="8" ry="3" />

      {/* Fundo da bandeja / profundidade do prato */}
      <path d="M4 14C4 17.5 7.6 19 12 19C16.4 19 20 17.5 20 14" />

      {/* Grânulos de ração peletizada (pellets) na bandeja */}
      <circle cx="9" cy="14" r="0.85" fill="currentColor" stroke="none" />
      <circle cx="12" cy="14.8" r="0.85" fill="currentColor" stroke="none" />
      <circle cx="15" cy="14" r="0.85" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="15.8" r="0.75" fill="currentColor" stroke="none" />
      <circle cx="13.5" cy="15.8" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * FeedBagIcon
 * Saco de ração aquícola balanceada com costura superior e selo nutricional.
 */
export function FeedBagIcon({ className = "w-6 h-6", size, strokeWidth = 1.8, ...props }) {
  const dimensionProps = size ? { width: size, height: size } : {};

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...dimensionProps}
      {...props}
    >
      {/* Borda superior com dobra e costura */}
      <path d="M7 3H17L18.5 5.5H5.5L7 3Z" />
      <path d="M7.5 4.5H16.5" strokeDasharray="1 1.5" />

      {/* Corpo do saco de ração */}
      <path d="M5.5 5.5C5 11 4.5 17.5 5.2 20.2C5.5 21 6.5 21.5 7.5 21.5H16.5C17.5 21.5 18.5 21 18.8 20.2C19.5 17.5 19 11 18.5 5.5" />

      {/* Selo / rótulo nutricional frontal */}
      <rect x="8.5" y="9.5" width="7" height="6" rx="1.5" />

      {/* Marca de pelete no rótulo */}
      <circle cx="12" cy="12.5" r="1.2" fill="currentColor" stroke="none" />
      <path d="M9.5 17.5H14.5" />
    </svg>
  );
}

/**
 * WaterQualityIcon
 * Medidor / sonda multiparâmetro portátil para análise de água em viveiros.
 * Possui display digital, botões de calibração, haste com bulbo sensor e ondas de lâmina d'água.
 */
export function WaterQualityIcon({ className = "w-6 h-6", size, strokeWidth = 1.8, ...props }) {
  const dimensionProps = size ? { width: size, height: size } : {};

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...dimensionProps}
      {...props}
    >
      {/* Corpo ergonômico do medidor multiparâmetro */}
      <rect x="7" y="2" width="10" height="10" rx="2" />

      {/* Visor digital (LCD / OLED) */}
      <rect x="9" y="4" width="6" height="3" rx="0.5" />

      {/* Botões de calibração */}
      <circle cx="10" cy="9.5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="14" cy="9.5" r="0.6" fill="currentColor" stroke="none" />

      {/* Haste / cabo da sonda */}
      <path d="M12 12V15.5" />

      {/* Eletrodo / bulbo de leitura (sensor multiparâmetro) */}
      <path d="M10.5 15.5H13.5V18C13.5 19 12 19.5 12 19.5C12 19.5 10.5 19 10.5 18V15.5Z" />

      {/* Ondulações da água ao redor da sonda */}
      <path d="M2.5 17C4 16.2 5.5 17.8 7 17C7.8 16.5 8.5 16.6 9 17" />
      <path d="M15 17C15.8 16.6 16.8 16.5 17.5 17C19 17.8 20.5 16.2 22 17" />
      <path d="M4 21C6 20.2 7.5 21.8 9.5 21" />
      <path d="M14.5 21C16.5 20.2 18 21.8 20 21" />
    </svg>
  );
}

export default {
  ShrimpIcon,
  FeedTrayIcon,
  FeedBagIcon,
  WaterQualityIcon,
};
