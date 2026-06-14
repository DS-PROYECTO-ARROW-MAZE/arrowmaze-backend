# Arquitectura del Backend — Arrow Maze

Arquitectura **hexagonal de 3 capas** (Dominio, Aplicación, Infraestructura) con **DDD táctico**.
Regla de dependencia: todo apunta **hacia adentro** (Infraestructura → Aplicación → Dominio).
El backend gestiona **identidad, definición de niveles, progresión y ranking**. La lógica de juego
(tablero, flechas, colisiones) vive en el frontend.

## Leyenda de notación UML

| Relación | Conector | Significado |
|---|---|---|
| Composición | `◆——` (rombo relleno en el "todo") | el contenido no vive sin el contenedor |
| Realización / Implementación | `⊳` (línea punteada, triángulo hueco hacia la interfaz) | una clase implementa una interfaz |
| Agregación | `◇——` (rombo hueco) | el contenedor referencia algo que vive aparte |
| Dependencia | `┈>` (flecha punteada abierta) | usa / depende de una abstracción |

Convención de miembros: `+` público, `-` privado, `(estático)` = subrayado en UML.

---

## CAPA DE DOMINIO

### Raíces de Agregado

**Jugador** «Raíz de Agregado»
Atributos:
- `+ id: IdJugador`
- `+ correo: CorreoElectronico`
- `+ nombre: NombreUsuario`
- `+ hashContrasena: HashContrasena`
- `+ progreso: List<ProgresoNivel>`

Métodos:
- `+ registrar(correo: CorreoElectronico, nombre: NombreUsuario, hash: HashContrasena): Jugador (estático)`
- `+ registrarComplecion(idNivel: IdNivel, puntaje: Puntaje, estrellas: Estrellas, movimientos: Movimientos, tiempo: TiempoSegundos): void`
- `+ verificarContrasena(hashIngresado: HashContrasena): bool`
- `- liberarEventos(): List<EventoDominio>`

**Nivel** «Raíz de Agregado»
Atributos:
- `+ id: IdNivel`
- `+ numero: NumeroNivel`
- `+ dificultad: DificultadNivel`
- `+ definicion: DefinicionTablero`
- `+ estado: EstadoPublicacion`

Métodos:
- `+ crear(numero: NumeroNivel, dificultad: DificultadNivel, definicion: DefinicionTablero): Nivel (estático)`
- `+ publicar(): void`
- `+ actualizarDefinicion(definicion: DefinicionTablero): void`

### Entidad

**ProgresoNivel** «Entidad» — vive dentro del agregado Jugador
Atributos:
- `+ idNivel: IdNivel` (Value Object; referencia por identidad al agregado Nivel + identidad local dentro de Jugador)
- `+ mejorPuntaje: Puntaje`
- `+ estrellas: Estrellas`
- `+ movimientos: Movimientos`
- `+ tiempo: TiempoSegundos`
- `+ fechaCompletado: Date`

Métodos:
- `+ esMejorQue(puntaje: Puntaje): bool`

### Objetos de Valor

Patrón común: un valor + factory `crear()` estático que valida (la validación vive aquí, no en la entidad).

- **IdJugador** — `+ valor: UUID` · `+ crear(valor: UUID): IdJugador (estático)`
- **IdNivel** — `+ valor: UUID` · `+ crear(valor: UUID): IdNivel (estático)`
- **CorreoElectronico** — `+ valor: string` · `+ crear(valor: string): CorreoElectronico (estático)`
- **NombreUsuario** — `+ valor: string` · `+ crear(valor: string): NombreUsuario (estático)`
- **HashContrasena** — `+ valor: string` · `+ crear(valor: string): HashContrasena (estático)`
- **NumeroNivel** — `+ valor: int` · `+ crear(valor: int): NumeroNivel (estático)`
- **Puntaje** — `+ valor: int` · `+ crear(valor: int): Puntaje (estático)` · `+ esMayorQue(otro: Puntaje): bool`
- **Estrellas** — `+ valor: int` · `+ crear(valor: int): Estrellas (estático)`
- **Movimientos** — `+ valor: int` · `+ crear(valor: int): Movimientos (estático)`
- **TiempoSegundos** — `+ valor: int` · `+ crear(valor: int): TiempoSegundos (estático)`
- **DefinicionTablero** — `+ json: string` · `+ crear(json: string): DefinicionTablero (estático)` · `- validarEstructura(): void`
- **DificultadNivel** — `+ valor: Enum` · `+ Facil (estático)` · `+ Medio (estático)` · `+ Dificil (estático)`
- **EstadoPublicacion** — `+ valor: Enum` · `+ Borrador (estático)` · `+ Publicado (estático)`

### Eventos de Dominio

- **JugadorRegistrado** «Evento de Dominio» — `+ idJugador: IdJugador` · `+ ocurridoEn: Date`
- **NivelCompletado** «Evento de Dominio» — `+ idJugador: IdJugador` · `+ idNivel: IdNivel` · `+ puntaje: Puntaje` · `+ ocurridoEn: Date`
- **RecordSuperado** «Evento de Dominio» — `+ idJugador: IdJugador` · `+ idNivel: IdNivel` · `+ nuevoRecord: Puntaje` · `+ ocurridoEn: Date`

### Interfaces de Repositorio (puertos en Dominio)

**IRepositorioJugador** «interface»
- `+ obtenerPorId(id: IdJugador): Jugador`
- `+ obtenerPorCorreo(correo: CorreoElectronico): Jugador`
- `+ existeCorreo(correo: CorreoElectronico): bool`
- `+ guardar(jugador: Jugador): void`

**IRepositorioNivel** «interface»
- `+ obtenerPorId(id: IdNivel): Nivel`
- `+ obtenerPorNumero(numero: NumeroNivel): Nivel`
- `+ listarPublicados(): List<Nivel>`
- `+ guardar(nivel: Nivel): void`

---

## CAPA DE APLICACIÓN

### Contrato base

**ICasoDeUso** «interface» — `+ ejecutar(entrada): salida`

### Casos de Uso

Cada uno implementa `ICasoDeUso`. Los atributos son sus dependencias inyectadas.

**RegistrarJugadorCasoDeUso** «Caso de Uso»
Atributos: `- repositorioJugador: IRepositorioJugador` · `- servicioHash: IServicioHash` · `- publicadorEventos: IPublicadorEventos` · `- unidadDeTrabajo: IUnidadDeTrabajo` · `- mapeador: MapeadorJugador`
Métodos: `+ ejecutar(req: RegistrarJugadorRequest): RegistrarJugadorResponse`

**IniciarSesionCasoDeUso** «Caso de Uso»
Atributos: `- repositorioJugador: IRepositorioJugador` · `- servicioHash: IServicioHash` · `- generadorToken: IGeneradorToken`
Métodos: `+ ejecutar(req: IniciarSesionRequest): IniciarSesionResponse`

**SincronizarProgresoCasoDeUso** «Caso de Uso»
Atributos: `- repositorioJugador: IRepositorioJugador` · `- publicadorEventos: IPublicadorEventos` · `- unidadDeTrabajo: IUnidadDeTrabajo`
Métodos: `+ ejecutar(req: SincronizarProgresoRequest): SincronizarProgresoResponse`

**CrearNivelCasoDeUso** «Caso de Uso»
Atributos: `- repositorioNivel: IRepositorioNivel` · `- unidadDeTrabajo: IUnidadDeTrabajo` · `- mapeador: MapeadorNivel`
Métodos: `+ ejecutar(req: CrearNivelRequest): NivelResponse`

**ObtenerNivelCasoDeUso** «Caso de Uso»
Atributos: `- repositorioNivel: IRepositorioNivel` · `- mapeador: MapeadorNivel`
Métodos: `+ ejecutar(id: IdNivel): NivelResponse`

**ActualizarNivelCasoDeUso** «Caso de Uso»
Atributos: `- repositorioNivel: IRepositorioNivel` · `- unidadDeTrabajo: IUnidadDeTrabajo`
Métodos: `+ ejecutar(req: ActualizarNivelRequest): NivelResponse`

**ListarNivelesCasoDeUso** «Caso de Uso»
Atributos: `- repositorioNivel: IRepositorioNivel` · `- mapeador: MapeadorNivel`
Métodos: `+ ejecutar(): List<NivelResponse>`

**ObtenerRankingCasoDeUso** «Caso de Uso»
Atributos: `- consultaRanking: IConsultaRanking`
Métodos: `+ ejecutar(req: RankingRequest): List<EntradaRankingResponse>`

### Puertos técnicos (interfaces en Aplicación)

- **IServicioHash** «interface» — `+ hashear(textoPlano: string): HashContrasena` · `+ verificar(textoPlano: string, hash: HashContrasena): bool`
- **IGeneradorToken** «interface» — `+ generar(idJugador: IdJugador): string` · `+ validar(token: string): IdJugador`
- **IPublicadorEventos** «interface» — `+ publicar(eventos: List<EventoDominio>): void`
- **IUnidadDeTrabajo** «interface» — `+ iniciar(): void` · `+ confirmar(): void` · `+ revertir(): void`
- **IConsultaRanking** «interface» (read model) — `+ obtenerTop(idNivel: IdNivel, limite: int): List<EntradaRankingResponse>`

### Mapeadores

- **MapeadorJugador** «Mapeador» — `+ aRespuesta(jugador: Jugador): RegistrarJugadorResponse`
- **MapeadorNivel** «Mapeador» — `+ aDominio(req: CrearNivelRequest): Nivel` · `+ aRespuesta(nivel: Nivel): NivelResponse`

### DTOs (solo atributos)

- **RegistrarJugadorRequest** «DTO» — `+ correo: string` · `+ nombre: string` · `+ contrasena: string`
- **RegistrarJugadorResponse** «DTO» — `+ idJugador: string` · `+ correo: string`
- **IniciarSesionRequest** «DTO» — `+ correo: string` · `+ contrasena: string`
- **IniciarSesionResponse** «DTO» — `+ token: string` · `+ idJugador: string`
- **SincronizarProgresoRequest** «DTO» — `+ idJugador: string` · `+ niveles: List<ProgresoNivelDTO>`
- **ProgresoNivelDTO** «DTO» — `+ idNivel: string` · `+ puntaje: int` · `+ estrellas: int` · `+ movimientos: int` · `+ tiempo: int`
- **SincronizarProgresoResponse** «DTO» — `+ nivelesSincronizados: int` · `+ recordsNuevos: int`
- **CrearNivelRequest** «DTO» — `+ numero: int` · `+ dificultad: string` · `+ definicionJson: string`
- **ActualizarNivelRequest** «DTO» — `+ idNivel: string` · `+ definicionJson: string`
- **NivelResponse** «DTO» — `+ idNivel: string` · `+ numero: int` · `+ dificultad: string` · `+ definicionJson: string` · `+ estado: string`
- **RankingRequest** «DTO» — `+ idNivel: string` · `+ limite: int`
- **EntradaRankingResponse** «DTO» — `+ posicion: int` · `+ nombreJugador: string` · `+ puntaje: int`

---

## CAPA DE INFRAESTRUCTURA

> **ORM: Prisma.** El acceso a datos se hace con Prisma sobre PostgreSQL (alojado en Supabase).
> Los adaptadores de persistencia reciben `ServicioPrisma` (envuelve `PrismaClient`) y traducen
> filas Prisma ↔ agregados de dominio con un mapeador (`MapeadorPersistencia...`), de modo que los
> tipos generados por Prisma nunca salen de la capa de infraestructura. El esquema y las migraciones
> viven en una carpeta `prisma/` en la raíz del proyecto.

### Adaptadores de persistencia

**RepositorioJugadorPrisma** «Adaptador» — implementa IRepositorioJugador
Atributos: `- prisma: ServicioPrisma`
Métodos: `+ obtenerPorId(id: IdJugador): Jugador` · `+ obtenerPorCorreo(correo: CorreoElectronico): Jugador` · `+ existeCorreo(correo: CorreoElectronico): bool` · `+ guardar(jugador: Jugador): void`

**RepositorioNivelPrisma** «Adaptador» — implementa IRepositorioNivel
Atributos: `- prisma: ServicioPrisma`
Métodos: `+ obtenerPorId(id: IdNivel): Nivel` · `+ obtenerPorNumero(numero: NumeroNivel): Nivel` · `+ listarPublicados(): List<Nivel>` · `+ guardar(nivel: Nivel): void`

**ConsultaRankingPrisma** «Adaptador» — implementa IConsultaRanking
Atributos: `- prisma: ServicioPrisma`
Métodos: `+ obtenerTop(idNivel: IdNivel, limite: int): List<EntradaRankingResponse>`

### Adaptadores de puertos técnicos

- **ServicioHashBcrypt** «Adaptador» (implementa IServicioHash) — `+ hashear(textoPlano: string): HashContrasena` · `+ verificar(textoPlano: string, hash: HashContrasena): bool`
- **GeneradorTokenJwt** «Adaptador» (implementa IGeneradorToken) — Atributos: `- claveSecreta: string` · Métodos: `+ generar(idJugador: IdJugador): string` · `+ validar(token: string): IdJugador`
- **PublicadorEventosPrisma** «Adaptador» (implementa IPublicadorEventos) — Atributos: `- prisma: ServicioPrisma` · Métodos: `+ publicar(eventos: List<EventoDominio>): void`
- **UnidadDeTrabajoPrisma** «Adaptador» (implementa IUnidadDeTrabajo) — Atributos: `- prisma: ServicioPrisma` · Métodos: `+ iniciar(): void` · `+ confirmar(): void` · `+ revertir(): void` _(envuelve `prisma.$transaction`)_

### Aspectos AOP (decoradores de casos de uso)

- **InterceptorLogging** «Aspecto» (implementa ICasoDeUso) — Atributos: `- siguiente: ICasoDeUso` · Métodos: `+ ejecutar(entrada): salida`
- **InterceptorMetricas** «Aspecto» (implementa ICasoDeUso) — Atributos: `- siguiente: ICasoDeUso` · Métodos: `+ ejecutar(entrada): salida`

### Controladores REST (adaptadores de entrada)

**ControladorAuth** «Controlador»
Atributos: `- registrarJugador: RegistrarJugadorCasoDeUso` · `- iniciarSesion: IniciarSesionCasoDeUso`
Métodos: `+ registrar(req: RegistrarJugadorRequest)` · `+ iniciarSesion(req: IniciarSesionRequest)`

**ControladorNiveles** «Controlador»
Atributos: `- crearNivel: CrearNivelCasoDeUso` · `- obtenerNivel: ObtenerNivelCasoDeUso` · `- actualizarNivel: ActualizarNivelCasoDeUso` · `- listarNiveles: ListarNivelesCasoDeUso`
Métodos: `+ crear(req: CrearNivelRequest)` · `+ obtener(idNivel: string)` · `+ actualizar(req: ActualizarNivelRequest)` · `+ listar()`

**ControladorProgreso** «Controlador»
Atributos: `- sincronizarProgreso: SincronizarProgresoCasoDeUso`
Métodos: `+ sincronizar(req: SincronizarProgresoRequest)`

**ControladorRanking** «Controlador»
Atributos: `- obtenerRanking: ObtenerRankingCasoDeUso`
Métodos: `+ obtenerRanking(req: RankingRequest)`

### Cliente externo

**ServicioPrisma** «Externo» (envuelve `PrismaClient`) — `+ $transaction(operaciones)` · `+ <modelo>` (accesores generados, p. ej. `jugador`, `nivel`) · `+ $connect()` · `+ $disconnect()`
_DB subyacente: PostgreSQL alojado en Supabase._

---

## RELACIONES (completas)

### Composición — `◆——` (rombo relleno del lado del "todo")

- `Jugador "1" ◆—— "0..*" ProgresoNivel` (contiene)
- `Jugador ◆—— IdJugador`
- `Jugador ◆—— CorreoElectronico`
- `Jugador ◆—— NombreUsuario`
- `Jugador ◆—— HashContrasena`
- `ProgresoNivel ◆—— IdNivel`
- `ProgresoNivel ◆—— Puntaje`
- `ProgresoNivel ◆—— Estrellas`
- `ProgresoNivel ◆—— Movimientos`
- `ProgresoNivel ◆—— TiempoSegundos`
- `Nivel ◆—— IdNivel`
- `Nivel ◆—— NumeroNivel`
- `Nivel ◆—— DificultadNivel`
- `Nivel ◆—— DefinicionTablero`
- `Nivel ◆—— EstadoPublicacion`
- `SincronizarProgresoRequest ◆—— ProgresoNivelDTO`

### Realización / Implementación — `⊳` (punteada, triángulo hueco hacia la interfaz)

- `RegistrarJugadorCasoDeUso ⊳ ICasoDeUso`
- `IniciarSesionCasoDeUso ⊳ ICasoDeUso`
- `SincronizarProgresoCasoDeUso ⊳ ICasoDeUso`
- `CrearNivelCasoDeUso ⊳ ICasoDeUso`
- `ObtenerNivelCasoDeUso ⊳ ICasoDeUso`
- `ActualizarNivelCasoDeUso ⊳ ICasoDeUso`
- `ListarNivelesCasoDeUso ⊳ ICasoDeUso`
- `ObtenerRankingCasoDeUso ⊳ ICasoDeUso`
- `InterceptorLogging ⊳ ICasoDeUso`
- `InterceptorMetricas ⊳ ICasoDeUso`
- `RepositorioJugadorPrisma ⊳ IRepositorioJugador`
- `RepositorioNivelPrisma ⊳ IRepositorioNivel`
- `ConsultaRankingPrisma ⊳ IConsultaRanking`
- `ServicioHashBcrypt ⊳ IServicioHash`
- `GeneradorTokenJwt ⊳ IGeneradorToken`
- `PublicadorEventosPrisma ⊳ IPublicadorEventos`
- `UnidadDeTrabajoPrisma ⊳ IUnidadDeTrabajo`

### Agregación — `◇——` (rombo hueco; el decorador "tiene" al envuelto)

- `InterceptorLogging ◇—— ICasoDeUso` (decora)
- `InterceptorMetricas ◇—— ICasoDeUso` (decora)

### Dependencia — `┈>` (flecha punteada abierta)

Agregados graban eventos:
- `Jugador ┈> JugadorRegistrado`
- `Jugador ┈> NivelCompletado`
- `Jugador ┈> RecordSuperado`

Repositorios administran agregados:
- `IRepositorioJugador ┈> Jugador`
- `IRepositorioNivel ┈> Nivel`

Casos de uso → puertos / repos / mapeadores:
- `RegistrarJugadorCasoDeUso ┈> IRepositorioJugador`
- `RegistrarJugadorCasoDeUso ┈> IServicioHash`
- `RegistrarJugadorCasoDeUso ┈> IPublicadorEventos`
- `RegistrarJugadorCasoDeUso ┈> IUnidadDeTrabajo`
- `RegistrarJugadorCasoDeUso ┈> MapeadorJugador`
- `IniciarSesionCasoDeUso ┈> IRepositorioJugador`
- `IniciarSesionCasoDeUso ┈> IServicioHash`
- `IniciarSesionCasoDeUso ┈> IGeneradorToken`
- `SincronizarProgresoCasoDeUso ┈> IRepositorioJugador`
- `SincronizarProgresoCasoDeUso ┈> IPublicadorEventos`
- `SincronizarProgresoCasoDeUso ┈> IUnidadDeTrabajo`
- `CrearNivelCasoDeUso ┈> IRepositorioNivel`
- `CrearNivelCasoDeUso ┈> IUnidadDeTrabajo`
- `CrearNivelCasoDeUso ┈> MapeadorNivel`
- `ObtenerNivelCasoDeUso ┈> IRepositorioNivel`
- `ObtenerNivelCasoDeUso ┈> MapeadorNivel`
- `ActualizarNivelCasoDeUso ┈> IRepositorioNivel`
- `ActualizarNivelCasoDeUso ┈> IUnidadDeTrabajo`
- `ListarNivelesCasoDeUso ┈> IRepositorioNivel`
- `ListarNivelesCasoDeUso ┈> MapeadorNivel`
- `ObtenerRankingCasoDeUso ┈> IConsultaRanking`

Casos de uso → DTOs (entrada / salida):
- `RegistrarJugadorCasoDeUso ┈> RegistrarJugadorRequest`
- `RegistrarJugadorCasoDeUso ┈> RegistrarJugadorResponse`
- `IniciarSesionCasoDeUso ┈> IniciarSesionRequest`
- `IniciarSesionCasoDeUso ┈> IniciarSesionResponse`
- `SincronizarProgresoCasoDeUso ┈> SincronizarProgresoRequest`
- `SincronizarProgresoCasoDeUso ┈> SincronizarProgresoResponse`
- `CrearNivelCasoDeUso ┈> CrearNivelRequest`
- `CrearNivelCasoDeUso ┈> NivelResponse`
- `ObtenerNivelCasoDeUso ┈> NivelResponse`
- `ActualizarNivelCasoDeUso ┈> ActualizarNivelRequest`
- `ActualizarNivelCasoDeUso ┈> NivelResponse`
- `ListarNivelesCasoDeUso ┈> NivelResponse`
- `ObtenerRankingCasoDeUso ┈> RankingRequest`
- `ObtenerRankingCasoDeUso ┈> EntradaRankingResponse`

Mapeadores → dominio y DTOs:
- `MapeadorJugador ┈> Jugador`
- `MapeadorJugador ┈> RegistrarJugadorResponse`
- `MapeadorNivel ┈> Nivel`
- `MapeadorNivel ┈> CrearNivelRequest`
- `MapeadorNivel ┈> NivelResponse`

Read model → DTO:
- `IConsultaRanking ┈> EntradaRankingResponse`
- `ConsultaRankingPrisma ┈> EntradaRankingResponse`

Adaptadores → cliente externo:
- `RepositorioJugadorPrisma ┈> ServicioPrisma`
- `RepositorioNivelPrisma ┈> ServicioPrisma`
- `ConsultaRankingPrisma ┈> ServicioPrisma`
- `PublicadorEventosPrisma ┈> ServicioPrisma`
- `UnidadDeTrabajoPrisma ┈> ServicioPrisma`

Controladores → casos de uso:
- `ControladorAuth ┈> RegistrarJugadorCasoDeUso`
- `ControladorAuth ┈> IniciarSesionCasoDeUso`
- `ControladorNiveles ┈> CrearNivelCasoDeUso`
- `ControladorNiveles ┈> ObtenerNivelCasoDeUso`
- `ControladorNiveles ┈> ActualizarNivelCasoDeUso`
- `ControladorNiveles ┈> ListarNivelesCasoDeUso`
- `ControladorProgreso ┈> SincronizarProgresoCasoDeUso`
- `ControladorRanking ┈> ObtenerRankingCasoDeUso`

Controladores → DTOs (opcional; solo los reciben y reenvían):
- `ControladorAuth ┈> RegistrarJugadorRequest` · `RegistrarJugadorResponse` · `IniciarSesionRequest` · `IniciarSesionResponse`
- `ControladorNiveles ┈> CrearNivelRequest` · `ActualizarNivelRequest` · `NivelResponse`
- `ControladorProgreso ┈> SincronizarProgresoRequest` · `SincronizarProgresoResponse`
- `ControladorRanking ┈> RankingRequest` · `EntradaRankingResponse`

> Nota DDD: `ProgresoNivel` referencia al agregado `Nivel` por **identidad** (`IdNivel`, un Value Object),
> no por referencia de objeto. Así `Nivel` queda fuera del límite de consistencia de `Jugador`.
> Score calculado en el frontend; el backend solo valida y rankea (leaderboard = read model, sin agregado).
