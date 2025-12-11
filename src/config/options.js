export const actionTree = [
  {
    id: 'finanzas',
    label: 'Finanzas',
    children: [
      { id: 'finanzas-11', label: 'Informe Siniestralidad', needsInput: false },
      { id: 'finanzas-12', label: 'Informe Primas', needsInput: false },
      { id: 'finanzas-13', label: 'Informe Comisiones', needsInput: false },
    ],
  },
  {
    id: 'comercial',
    label: 'Comercial',
    children: [
      {
        id: 'comercial-21',
        label: 'Visión Comercial',
        children: [
          {
            id: 'comercial-211',
            label: 'Sucursal',
            needsInput: true,
            request: {
              path: '/v1/action_cards/vision_comercial',
              method: 'GET',
              buildParams: ({ inputValue }) => ({ nivel: 'Sucursal', unidad: inputValue }),
            },
          },
          {
            id: 'comercial-212',
            label: 'DC',
            needsInput: true,
            request: {
              path: '/v1/action_cards/vision_comercial',
              method: 'GET',
              buildParams: ({ inputValue }) => ({ nivel: 'DC', unidad: inputValue }),
            },
          },
          {
            id: 'comercial-213',
            label: 'Mediador',
            needsInput: true,
            request: {
              path: '/v1/action_cards/vision_comercial',
              method: 'GET',
              buildParams: ({ inputValue }) => ({ nivel: 'Mediador', unidad: inputValue }),
            },
          },
        ],
      },
      { id: 'comercial-22', label: 'FTE', needsInput: false },
    ],
  },
  {
    id: 'ine',
    label: 'Estadísticas INE',
    children: [
      { id: 'ine-31', label: 'PIB', needsInput: false },
      { id: 'ine-32', label: 'Población', needsInput: false },
      { id: 'ine-33', label: 'Turismo', needsInput: false },
    ],
  },
];

export const quickAutomationOptions = [
  { id: 'contabilidad', label: 'Facturas Contabilidad Inversiones' },
  { id: 'transaccionales', label: 'Facturas Op. Transaccionales' },
  { id: 'contratos', label: 'Contratos SLA', runPath: '/v1/automations/contratos_sla' },
];
