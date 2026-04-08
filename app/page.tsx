import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Store, ArrowRight, BarChart3, DollarSign, Utensils, Link as LinkIcon, Quote } from 'lucide-react'

const SUBSCRIPTION_PRICE = process.env.SUBSCRIPTION_PRICE || "36000"

export default function VentasPage() {
	const formattedPrice = new Intl.NumberFormat('es-AR').format(Number(SUBSCRIPTION_PRICE))

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
							Sin comisiones por venta
						</Badge>
						<h1 className="text-4xl md:text-5xl lg:text-6xl font-light mb-6 text-foreground text-balance font-heading">
							Tecnología para vender tus productos saludables, sin TACC y de especialidad
						</h1>
						<p className="text-xl text-muted-foreground mb-8 text-pretty max-w-3xl mx-auto">
							Tu tienda online en minutos. Compartí el menú con un link y respondé menos mensajes.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Link href="/auth/sign-up">
								<Button
									size="lg"
									className="text-lg px-8 py-4 bg-accent hover:bg-accent/90 text-accent-foreground"
								>
									<Store className="w-5 h-5 mr-2" />
									Crear mi tienda en 15 minutos
								</Button>
							</Link>
							<Link href="#beneficios">
								<Button
									variant="outline"
									size="lg"
									className="text-lg px-8 py-4 bg-transparent"
								>
									Ver beneficios
									<ArrowRight className="w-5 h-5 ml-2" />
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* Beneficios Section */}
			<section id="beneficios" className="py-20">
				<div className="container mx-auto px-4">
					<div className="max-w-6xl mx-auto">
						<div className="text-center mb-16">
							<h2 className="text-3xl md:text-4xl font-bold mb-6 font-heading">
								Beneficios
							</h2>
						</div>

						<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
							<Card className="text-center p-6">
								<div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
									<Utensils className="w-6 h-6 text-green-600" />
								</div>
								<h3 className="font-semibold mb-2">Mostrar ingredientes y alérgenos</h3>
								<p className="text-sm text-muted-foreground">
									Precios claros sin confusión
								</p>
							</Card>

							<Card className="text-center p-6">
								<div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
									<LinkIcon className="w-6 h-6 text-blue-600" />
								</div>
								<h3 className="font-semibold mb-2">Un solo link</h3>
								<p className="text-sm text-muted-foreground">
									En lugar de responder precios uno por uno
								</p>
							</Card>

							<Card className="text-center p-6">
								<div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
									<BarChart3 className="w-6 h-6 text-purple-600" />
								</div>
								<h3 className="font-semibold mb-2">Estadísticas de ventas</h3>
								<p className="text-sm text-muted-foreground">
									Para saber qué funciona
								</p>
							</Card>

							<Card className="text-center p-6">
								<div className="w-12 h-12 bg-lime-100 rounded-full flex items-center justify-center mx-auto mb-4">
									<DollarSign className="w-6 h-6 text-lime-600" />
								</div>
								<h3 className="font-semibold mb-2">Sin comisiones por venta</h3>
								<p className="text-sm text-muted-foreground">
									Todo es para vos
								</p>
							</Card>
						</div>
					</div>
				</div>
			</section>

			{/* Cómo funciona Section */}
			<section className="py-20 bg-gradient-to-br from-fuchsia-50 to-lime-50">
				<div className="container mx-auto px-4">
					<div className="max-w-4xl mx-auto text-center mb-16">
						<h2 className="text-3xl md:text-4xl font-bold mb-6 font-heading">
							Cómo funciona
						</h2>
					</div>

					<div className="max-w-4xl mx-auto">
						<div className="grid md:grid-cols-3 gap-8">
							<Card className="text-center p-8 relative">
								<div className="w-16 h-16 bg-fuchsia-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
									1
								</div>
								<h3 className="text-xl font-semibold mb-3">Configuralo en minutos</h3>
								<p className="text-muted-foreground">
									Creá tu tienda con tu marca, productos y precios
								</p>
							</Card>

							<Card className="text-center p-8 relative">
								<div className="w-16 h-16 bg-fuchsia-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
									2
								</div>
								<h3 className="text-xl font-semibold mb-3">Compartí el link</h3>
								<p className="text-muted-foreground">
									En Instagram, WhatsApp o donde quieras
								</p>
							</Card>

							<Card className="text-center p-8 relative">
								<div className="w-16 h-16 bg-fuchsia-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
									3
								</div>
								<h3 className="text-xl font-semibold mb-3">Tus clientes compran fácil</h3>
								<p className="text-muted-foreground">
									Ven tu menú y compran sin preguntarte nada
								</p>
							</Card>
						</div>
					</div>
				</div>
			</section>

			{/* Testimonio Section */}
			<section className="py-20">
				<div className="container mx-auto px-4">
					<div className="max-w-3xl mx-auto text-center">
						<Quote className="w-16 h-16 mx-auto mb-8 text-fuchsia-300" />
						<blockquote className="text-2xl md:text-3xl font-light mb-8 text-foreground italic">
							"Ahora mis clientes ven mi menú sin preguntar todo el tiempo.
							Tengo más tiempo para cocinar."
						</blockquote>
						<p className="text-lg text-muted-foreground">
							— Viandas saludables
						</p>
					</div>
				</div>
			</section>

			{/* Precio Section */}
			<section className="py-20 bg-fuchsia-50">
				<div className="container mx-auto px-4">
					<div className="max-w-2xl mx-auto">
						<Card className="relative overflow-hidden border-2 border-fuchsia-200 shadow-2xl">
							<div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-lime-500/5"></div>
							<CardHeader className="text-center relative z-10 pt-12">
								<div className="w-20 h-20 bg-fuchsia-100 rounded-full flex items-center justify-center mx-auto mb-6">
									<Store className="w-10 h-10 text-fuchsia-600" />
								</div>
								<div className="text-center">
									<div className="flex items-baseline justify-center gap-2 mb-4">
										<span className="text-5xl font-bold text-fuchsia-600">$ {formattedPrice}</span>
										<span className="text-xl text-muted-foreground">/ mes</span>
									</div>
									<p className="text-lg text-lime-600 font-semibold mb-2">Sin comisiones</p>
									<p className="text-muted-foreground">Lo que vendés es 100% tuyo</p>
								</div>
							</CardHeader>
							<CardFooter className="relative z-10 pt-6 pb-12">
								<Link href="/auth/sign-up" className="w-full">
									<Button 
										size="lg"
										className="w-full text-lg py-6 bg-gradient-to-r from-fuchsia-700 to-fuchsia-500 hover:from-fuchsia-500 hover:to-fuchsia-700 text-white shadow-lg"
									>
										<Store className="w-5 h-5 mr-2" />
										Crear mi tienda enfocada en salud
										<ArrowRight className="w-5 h-5 ml-2" />
									</Button>
								</Link>
							</CardFooter>
						</Card>
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
