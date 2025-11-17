import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Store, MessageCircle, CreditCard, TrendingUp, Users, Zap, Shield, CheckCircle, ArrowRight, BarChart3, Bell, Package, Truck, DollarSign, Clock, Star, Check } from 'lucide-react'

export default function VentasPage() {
	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
				<div className="container mx-auto px-4 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="flex shrink-0 items-center">
								<Image
									src="/foodynow_logo-wt.svg"
									alt="FOODYNOW"
									width={100}
									height={45}
									className="h-10 w-auto"
									priority
								/>
							</div>
						</div>
						<div className="flex gap-2">
							<Link href="/auth/login">
								<Button variant="outline">Iniciar Sesión</Button>
							</Link>
							<Link href="/auth/sign-up">
								<Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
									Comenzar
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</header>

			{/* Hero Section */}
			<section className="bg-gradient-to-br from-fuchsia-50 to-lime-50 py-16 md:py-24 lg:py-32">
				<div className="container mx-auto px-4">
					<div className="max-w-5xl mx-auto text-center">
						<Badge className="mb-6 bg-accent text-accent-foreground border-accent">
							Tecnología pensada para vos
						</Badge>
						<h1 className="text-4xl md:text-5xl lg:text-6xl font-light mb-6 text-foreground text-balance font-heading">
							Impulsá tu negocio de alimentos con tecnología pensada para vos
						</h1>
						<p className="text-xl text-muted-foreground mb-8 text-pretty max-w-3xl mx-auto">
							<span className="font-bold text-primary">FOODYNOW®</span> es la solución
							digital para productores, emprendedores y comercios gastronómicos que
							elaboran alimentos saludables, artesanales o de especialidad.
							Simplificamos tus ventas, mejoramos tu comunicación con clientes y
							maximizamos tus ganancias —sin comisiones ni intermediarios.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Link href="/auth/sign-up">
								<Button
									size="lg"
									className="text-lg px-8 py-4 bg-accent hover:bg-accent/90 text-accent-foreground"
								>
									<Store className="w-5 h-5 mr-2" />
									Comenzá ahora
								</Button>
							</Link>
							<Link href="#beneficios">
								<Button
									variant="outline"
									size="lg"
									className="text-lg px-8 py-4 bg-transparent"
								>
									Ver más beneficios
									<ArrowRight className="w-5 h-5 ml-2" />
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* Vende más y mejor Section */}
			<section className="py-20">
				<div className="container mx-auto px-4">
					<div className="max-w-6xl mx-auto">
						<div className="text-center mb-16">
							<h2 className="text-3xl md:text-4xl font-bold mb-6 font-heading">
								Vendé más y mejor, con tu propia tienda online
							</h2>
							<p className="text-lg text-muted-foreground max-w-3xl mx-auto text-pretty">
								Creá tu tienda en minutos, conectada directamente con MercadoPago y
								WhatsApp para brindar una experiencia de compra fluida, rápida y
								segura.
							</p>
						</div>

						<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
							<Card className="text-center p-6">
								<div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
									<CreditCard className="w-6 h-6 text-green-600" />
								</div>
								<h3 className="font-semibold mb-2">Pagos 100% seguros</h3>
								<p className="text-sm text-muted-foreground">
									Con todas las opciones de MercadoPago
								</p>
							</Card>

							<Card className="text-center p-6">
								<div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
									<MessageCircle className="w-6 h-6 text-blue-600" />
								</div>
								<h3 className="font-semibold mb-2">Atención directa</h3>
								<p className="text-sm text-muted-foreground">
									Por WhatsApp, sin apps extra ni complicaciones
								</p>
							</Card>

							<Card className="text-center p-6">
								<div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
									<Package className="w-6 h-6 text-purple-600" />
								</div>
								<h3 className="font-semibold mb-2">Pedidos automatizados</h3>
								<p className="text-sm text-muted-foreground">
									Sin intervención manual
								</p>
							</Card>

							<Card className="text-center p-6">
								<div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
									<Truck className="w-6 h-6 text-orange-600" />
								</div>
								<h3 className="font-semibold mb-2">Flexibilidad total</h3>
								<p className="text-sm text-muted-foreground">
									Entrega a domicilio o retiro en local
								</p>
							</Card>
						</div>
					</div>
				</div>
			</section>

			{/* Potencia tu negocio Section */}
			<section className="py-20 bg-gradient-to-br from-fuchsia-50 to-lime-50">
				<div className="container mx-auto px-4">
					<div className="max-w-4xl mx-auto text-center mb-16">
						<Badge className="mb-6 bg-fuchsia-600 text-white border-fuchsia-600">
							<Zap className="w-4 h-4 mr-1" />
							Potencia tu negocio
						</Badge>
						<h2 className="text-3xl md:text-4xl font-bold mb-6 font-heading text-fuchsia-600">
							Comenzá hoy mismo con tu tienda virtual
						</h2>
						<p className="text-lg text-muted-foreground text-pretty">
							Moderniza tu estrategia comercial con FOODYNOW y lleva tu negocio al siguiente nivel con herramientas profesionales
						</p>
					</div>

					{/* Pricing Card */}
					<div className="max-w-2xl mx-auto">
						<Card className="relative overflow-hidden border-2 border-fuchsia-200 shadow-2xl">
							<div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-lime-500/5"></div>
							<CardHeader className="text-center relative z-10">
								<div className="w-16 h-16 bg-fuchsia-100 rounded-full flex items-center justify-center mx-auto mb-4">
									<Store className="w-8 h-8 text-fuchsia-600" />
								</div>
								<CardTitle className="text-2xl font-bold text-fuchsia-600 mb-2">TIENDA NOW</CardTitle>
								<CardDescription className="text-lg mb-6">Todo lo que necesitas para vender online</CardDescription>
								<div className="text-center">
									<div className="flex items-baseline justify-center gap-2 mb-2">
										<span className="text-4xl font-bold text-fuchsia-600">$ 36.000</span>
										<span className="text-muted-foreground">ars /mes</span>
									</div>
									<p className="text-sm text-lime-600 font-medium">Sin comisiones por venta</p>
								</div>
							</CardHeader>
							<CardContent className="relative z-10 px-8">
								<div className="space-y-6">
									<div>
										<h4 className="font-semibold text-lg mb-4 flex items-center gap-2 text-fuchsia-600">
											<MessageCircle className="w-5 h-5" />
											Ventas y Comunicación
										</h4>
										<div className="space-y-3">
											<div className="flex items-start gap-3">
												<Check className="w-5 h-5 text-lime-600 flex-shrink-0 mt-0.5" />
												<span className="text-sm">Tienda online personalizada con tu marca</span>
											</div>
											<div className="flex items-start gap-3">
												<Check className="w-5 h-5 text-lime-600 flex-shrink-0 mt-0.5" />
												<span className="text-sm">Integración con Redes y WhatsApp</span>
											</div>
											<div className="flex items-start gap-3">
												<Check className="w-5 h-5 text-lime-600 flex-shrink-0 mt-0.5" />
												<span className="text-sm">Catálogo ilimitado de productos</span>
											</div>
											<div className="flex items-start gap-3">
												<Check className="w-5 h-5 text-lime-600 flex-shrink-0 mt-0.5" />
												<span className="text-sm">Carrito de compras dinámico</span>
											</div>
											<div className="flex items-start gap-3">
												<Check className="w-5 h-5 text-lime-600 flex-shrink-0 mt-0.5" />
												<span className="text-sm">Notificaciones automáticas a clientes</span>
											</div>
										</div>
									</div>
								</div>
							</CardContent>
							<CardFooter className="relative z-10 pt-0 pb-8">
								<Link href="/auth/sign-up" className="w-full">
									<Button 
										size="lg"
										className="w-full text-lg py-6 bg-gradient-to-r from-fuchsia-700 to-fuchsia-500 hover:from-fuchsia-500 hover:to-fuchsia-700 text-white shadow-lg"
									>
										<Clock className="w-5 h-5 mr-2" />
										Quiero probar por 15 días
										<ArrowRight className="w-5 h-5 ml-2" />
									</Button>
								</Link>
							</CardFooter>
						</Card>
					</div>
				</div>
			</section>

			{/* Por qué elegir FOODYNOW Section */}
			<section id="beneficios" className="py-20 bg-fuchsia-50">
				<div className="container mx-auto px-4">
					<div className="max-w-6xl mx-auto">
						<div className="text-center mb-16">
							<h2 className="text-3xl md:text-4xl font-bold mb-6 font-heading">
								¿Por qué elegir FOODYNOW?
							</h2>
						</div>

						<div className="grid lg:grid-cols-2 gap-8">
							<Card className="p-8">
								<div className="flex gap-4 mb-4">
									<div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
										<TrendingUp className="w-6 h-6 text-accent" />
									</div>
									<div>
										<h3 className="text-xl font-semibold mb-2">
											Aumentá tu eficiencia operativa
										</h3>
										<p className="text-muted-foreground">
											Automatizá ventas, cobros y gestión diaria. Ganá tiempo
											para enfocarte en lo que sabés hacer: producir.
										</p>
									</div>
								</div>
							</Card>

							<Card className="p-8">
								<div className="flex gap-4 mb-4">
									<div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
										<BarChart3 className="w-6 h-6 text-primary" />
									</div>
									<div>
										<h3 className="text-xl font-semibold mb-2">
											Control total de tus pedidos
										</h3>
										<p className="text-muted-foreground">
											Usá el panel de gestión para hacer seguimiento en tiempo
											real y enviar mensajes automatizados a tus clientes.
										</p>
									</div>
								</div>
							</Card>

							<Card className="p-8">
								<div className="flex gap-4 mb-4">
									<div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
										<Zap className="w-6 h-6 text-blue-600" />
									</div>
									<div>
										<h3 className="text-xl font-semibold mb-2">
											Datos que te ayudan a crecer
										</h3>
										<p className="text-muted-foreground">
											Accedé a estadísticas clave para tomar mejores decisiones
											comerciales.
										</p>
									</div>
								</div>
							</Card>

							<Card className="p-8">
								<div className="flex gap-4 mb-4">
									<div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
										<Users className="w-6 h-6 text-green-600" />
									</div>
									<div>
										<h3 className="text-xl font-semibold mb-2">
											Fidelizá a tus clientes
										</h3>
										<p className="text-muted-foreground">
											Creá campañas personalizadas con promociones, beneficios y
											fechas especiales.
										</p>
									</div>
								</div>
							</Card>

							<Card className="p-8 lg:col-span-2 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
								<div className="flex gap-4 mb-4">
									<div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
										<DollarSign className="w-6 h-6 text-accent-foreground" />
									</div>
									<div>
										<h3 className="text-xl font-semibold mb-2">
											Sin comisiones por venta
										</h3>
										<p className="text-muted-foreground">
											Todo lo que vendés es tuyo. Sin sorpresas.
										</p>
									</div>
								</div>
							</Card>
						</div>
					</div>
				</div>
			</section>

			{/* Ideal para comercios Section */}
			<section className="py-20 bg-lime-50">
				<div className="container mx-auto px-4">
					<div className="max-w-5xl mx-auto text-center">
						<div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
							<Store className="w-8 h-8 text-primary-foreground" />
						</div>
						<h2 className="text-3xl md:text-4xl font-bold mb-6 font-heading">
							Ideal para comercios con alma
						</h2>
						<p className="text-lg text-muted-foreground mb-8 text-pretty">
							FOODYNOW está pensado para <strong>productores</strong>,{" "}
							<strong>cocineros</strong>, <strong>panaderías</strong>,{" "}
							<strong>dietéticas</strong>, <strong>fábricas de pastas</strong>,{" "}
							<strong>tiendas naturales</strong> y{" "}
							<strong>emprendimientos gastronómicos</strong> que ofrecen productos
							con valor agregado.
						</p>
						<div className="bg-fuchsia-600 rounded-2xl p-8 shadow-lg">
							<p className="text-xl font-semibold text-fuchsia-50">
								Si hacés comida real, nosotros hacemos que llegue mejor a tus
								clientes.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Proceso automatizado Section */}
			<section className="py-20">
				<div className="container mx-auto px-4">
					<div className="max-w-6xl mx-auto">
						<div className="text-center mb-16">
							<h2 className="text-3xl md:text-4xl font-bold mb-6 font-heading">
								Todo el proceso, automatizado
							</h2>
							<p className="text-lg text-muted-foreground max-w-3xl mx-auto">
								Desde el primer mensaje en redes sociales o WhatsApp, el cliente
								puede:
							</p>
						</div>

						<div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
							<div className="flex gap-4 items-start">
								<div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
									<CheckCircle className="w-5 h-5 text-primary-foreground" />
								</div>
								<div>
									<p className="font-medium">
										Ver tus categorías y productos con todos sus detalles y
										precios
									</p>
								</div>
							</div>

							<div className="flex gap-4 items-start">
								<div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0 mt-1">
									<CheckCircle className="w-5 h-5 text-accent-foreground" />
								</div>
								<div>
									<p className="font-medium">
										Consultar el menú del día o recibir sugerencias destacadas
									</p>
								</div>
							</div>

							<div className="flex gap-4 items-start">
								<div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
									<CheckCircle className="w-5 h-5 text-secondary-foreground" />
								</div>
								<div>
									<p className="font-medium">
										Elegir método de entrega y pagar con seguridad
									</p>
								</div>
							</div>

							<div className="flex gap-4 items-start">
								<div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
									<CheckCircle className="w-5 h-5 text-primary-foreground" />
								</div>
								<div>
									<p className="font-medium">
										Recibir notificaciones del estado de su pedido
									</p>
								</div>
							</div>
						</div>

						<div className="mt-12 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-8 border border-primary/20">
							<div className="flex items-center justify-center gap-3 mb-6">
								<Bell className="w-8 h-8 text-primary" />
								<h3 className="text-2xl font-semibold">Experiencia completa</h3>
							</div>
							<p className="text-center text-muted-foreground max-w-2xl mx-auto">
								El cliente recibe una experiencia fluida de principio a fin, con
								actualizaciones automáticas en cada paso del proceso, desde la
								selección hasta la entrega.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* CTA Final Section */}
			<section className="py-20 bg-gradient-to-r from-fuchsia-800 to-accent">
				<div className="container mx-auto px-4 text-center">
					<div className="max-w-4xl mx-auto text-white">
						<Star className="w-16 h-16 mx-auto mb-6 opacity-90" />
						<h2 className="text-3xl md:text-4xl font-bold mb-6 font-heading">
							¿Listo para transformar tu negocio?
						</h2>
						<p className="text-xl mb-8 opacity-90 text-pretty">
							Sumate a los comercios que ya están vendiendo más con FOODYNOW.
							Tecnología pensada para vos, sin complicaciones ni comisiones.
						</p>
						<p className="text-2xl font-semibold mb-8">
							Empezá hoy. Profesionalizá tu negocio y hacelo crecer.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Link href="/auth/sign-up">
								<Button
									size="lg"
									className="text-lg px-8 py-4 bg-white text-primary hover:bg-white/90"
								>
									<Store className="w-5 h-5 mr-2" />
									Crear mi tienda ahora
								</Button>
							</Link>
							<Link href="/auth/login">
								<Button
									variant="outline"
									size="lg"
									className="text-lg px-8 py-4 border-white text-white hover:bg-white/10 bg-transparent"
								>
									Ya tengo cuenta
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t bg-card py-12">
				<div className="container mx-auto px-4">
					<div className="max-w-4xl mx-auto text-center">
						<div className="flex items-center justify-center gap-3 mb-6">
							<Image
								src="/foodynow_logo-wt.svg"
								alt="FOODYNOW"
								width={120}
								height={50}
								className="h-12 w-auto"
							/>
						</div>
						<p className="text-muted-foreground mb-6">
							La plataforma moderna para comercios gastronómicos con alma
						</p>
						<div className="flex justify-center gap-6 text-sm text-muted-foreground">
							<Link href="/terms" className="hover:text-primary transition-colors">
								Términos de Servicio
							</Link>
							<Link
								href="/privacy"
								className="hover:text-primary transition-colors"
							>
								Política de Privacidad
							</Link>
							<Link href="/landing" className="hover:text-primary transition-colors">
								Inicio
							</Link>
						</div>
					</div>
				</div>
			</footer>
		</div>
	)
}
