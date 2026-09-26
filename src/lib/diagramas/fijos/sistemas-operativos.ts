/** Diagramas fijos del tema Sistemas operativos. */
import { insignia, tarjeta } from '../primitivas-procesos'
import { caja, flecha, marco, texto } from '../svg'

const nota = (y: number, t: string, clase = '') => texto(490, y, t, { clase: `t3s-nota ${clase}` })

/** Pila de un pedido: app → wrapper (modo usuario) → syscall (trap) → rutina del kernel. */
function wrapperSyscall(): string {
  const columna = (x: number, app: string, wrapper: string, syscall: string, rutina: string) => [
    flecha(`M${x},85 L${x},117`, 'llama', x + 28, 101),
    flecha(`M${x},169 L${x},262`, `syscall ${syscall}`, x + 64, 188),
    flecha(`M${x},314 L${x},344`),
    caja(x, 65, 200, 40, app),
    caja(x, 145, 200, 48, `${wrapper} de libc\n(wrapper)`, 'dg-activo'),
    insignia(x, 215, 'trap'),
    caja(x, 290, 200, 48, `${rutina}\ndel kernel`, 't3s-kernel'),
  ]
  return marco({
    ancho: 720,
    alto: 400,
    titulo:
      'De la aplicación al kernel: el wrapper es código de usuario y la syscall hace el cambio de modo',
    cuerpo: [
      `<text class="dg-zona" x="14" y="20">Modo usuario</text>`,
      `<line class="dg-separador" x1="0" y1="215" x2="720" y2="215"/>`,
      `<text class="dg-zona" x="14" y="235">Modo kernel</text>`,
      ...columna(150, 'printf("hola")', 'printf()', 'write()', 'sys_write()'),
      ...columna(370, 'fopen("a.txt", "r")', 'fopen()', 'open()', 'sys_open()'),
      caja(260, 365, 420, 34, 'Hardware: pantalla, disco'),
      nota(58, 'Código de la aplicación.'),
      nota(74, 'Nunca toca el hardware.'),
      nota(137, 'Función de biblioteca: código'),
      nota(153, 'de usuario, no cambia de modo.'),
      nota(199, 'La syscall cruza la línea:', 't3s-clave'),
      nota(231, 'el PSW pasa a modo kernel.', 't3s-clave'),
      nota(282, 'Rutina del SO: puede ejecutar'),
      nota(298, 'instrucciones privilegiadas.'),
      nota(365, 'Solo el kernel lo maneja.'),
    ],
  })
}

/** Anillos 0–3 con los dos modos que se usan en la práctica y el bit de modo del PSW. */
function anillosProteccion(): string {
  const c = { x: 190, y: 210 }
  const anillo = (r: number, n: number) =>
    `<circle class="t3s-anillo t3s-anillo-${n}" cx="${c.x}" cy="${c.y}" r="${r}"/>`
  const rotulo = (y: number, t: string, clase = 't3s-rotulo') => texto(c.x, y, t, { clase })
  return marco({
    ancho: 720,
    alto: 420,
    titulo:
      'Anillos de protección: modo kernel en el anillo 0, modo usuario en el 3, y el bit de modo en el PSW',
    cuerpo: [
      anillo(165, 3),
      anillo(125, 2),
      anillo(85, 1),
      anillo(45, 0),
      rotulo(65, '3 · aplicaciones'),
      rotulo(355, 'modo usuario', 't3s-rotulo t3s-rotulo-sub'),
      rotulo(105, '2 · drivers', 't3s-rotulo t3s-rotulo-tenue'),
      rotulo(145, '1 · drivers', 't3s-rotulo t3s-rotulo-tenue'),
      rotulo(203, '0 · kernel', 't3s-rotulo t3s-rotulo-fuerte'),
      rotulo(219, 'modo kernel', 't3s-rotulo t3s-rotulo-sub'),
      flecha('M355,352 L230,245', 'más privilegio', 372, 374),
      texto(
        14,
        404,
        'Anillos 1 y 2: pensados para drivers; en la práctica se usan solo el 0 y el 3.',
        {
          clase: 't3s-nota',
        },
      ),
      tarjeta(
        560,
        95,
        290,
        84,
        'Modo kernel · anillo 0',
        [
          { t: 'ejecuta cualquier instrucción,' },
          { t: 'incluidas las privilegiadas' },
          { t: 'ahí corre el SO' },
        ],
        { clase: 't3s-kernel' },
      ),
      tarjeta(
        560,
        205,
        290,
        84,
        'Modo usuario · anillo 3',
        [
          { t: 'solo instrucciones no privilegiadas' },
          { t: 'ahí corren las aplicaciones' },
          { t: 'lo privilegiado se pide con syscall' },
        ],
        { clase: 'dg-activo' },
      ),
      texto(418, 300, 'PSW', { clase: 't3s-psw' }),
      caja(488, 300, 76, 30, 'flags', 't3s-celda'),
      caja(590, 300, 120, 30, 'interrupciones', 't3s-celda'),
      caja(678, 300, 48, 30, 'modo', 't3s-celda t3s-bit'),
      texto(418, 336, 'El bit de modo dice si la CPU está', { clase: 't3s-nota t3s-izq' }),
      texto(418, 352, 'en modo usuario o en modo kernel.', { clase: 't3s-nota t3s-izq' }),
    ],
  })
}

export const diagramas: Record<string, () => string> = {
  'wrapper-syscall': wrapperSyscall,
  'anillos-proteccion': anillosProteccion,
}
