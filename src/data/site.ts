export const company = {
	name: 'Nome da sua empresa',
	logo: 'Sua logo',
	slogan: 'Seu slogan',
	address: 'Seu endereco, Bairro Central, Sua cidade - UF',
	streetAddress: 'Seu endereco',
	city: 'Sua cidade',
	state: 'UF',
	zipCode: '00000-000',
	phone: '(00) 0000-0000',
	phoneHref: 'tel:+550000000000',
	whatsappDisplay: '(00) 00000-0000',
	whatsappNumber: '5500000000000',
	email: 'seuemail@empresa.com.br',
	emailDisplay: 'Seu e-mail',
	emailHref: 'mailto:seuemail@empresa.com.br',
	instagram: 'Seu Instagram',
	instagramUrl: 'https://instagram.com/seuinstagram',
	facebook: 'Seu Facebook',
	facebookUrl: 'https://facebook.com/suaempresa',
	hours: 'Seg a Sab: 7h as 21h | Dom: 8h as 13h',
	serviceArea: 'Bairro, regiao central e arredores',
	coupon: 'BEMVINDO10',
};

export const accessibilityLinks = [
	{ label: 'Ir para conteudo', href: '#conteudo' },
	{ label: 'Ir para menu', href: '#menu-principal' },
	{ label: 'Ir para busca', href: '#busca' },
	{ label: 'Ir para ofertas', href: '#ofertas' },
	{ label: 'Ir para contato', href: '#contato' },
];

export const utilityLinks = [
	{ label: 'Como comprar', href: '#lista' },
	{ label: 'Retirar na loja', href: '#informacoes' },
	{ label: 'Receber em casa', href: '#informacoes' },
	{ label: 'Fale com a loja', href: '#contato' },
];

export const navItems = [
	{ label: 'Inicio', href: '#inicio' },
	{ label: 'Ofertas', href: '#ofertas' },
	{ label: 'Frutas e verduras', href: '#setor-hortifruti' },
	{ label: 'Padaria', href: '#setor-padaria' },
	{ label: 'Limpeza', href: '#setor-limpeza' },
	{ label: 'Minha lista', href: '#lista' },
	{ label: 'Contato', href: '#contato' },
];

export const headerShortcuts = [
	{ label: 'Ofertas do dia', icon: 'tag', href: '#ofertas' },
	{ label: 'Frutas e verduras', icon: 'produce', href: '#setor-hortifruti' },
	{ label: 'Padaria', icon: 'bread', href: '#setor-padaria' },
	{ label: 'Limpeza', icon: 'cleaner', href: '#setor-limpeza' },
	{ label: 'Minha lista', icon: 'basket', href: '#lista' },
];

export const heroSlides = [
	{
		id: 'pascoa',
		tag: 'FRETE GRATIS',
		title: 'Ofertas boas para comprar mais rapido',
		highlight: 'ate 30% OFF',
		description:
			'Veja as ofertas da semana, monte sua lista e fale com a loja sem complicacao.',
		primaryCta: 'Ver ofertas',
		secondaryCta: 'Pedir no WhatsApp',
		theme: 'olive',
		visuals: [
			{ type: 'bottle', label: 'Bebidas' },
			{ type: 'basket', label: 'Lista pronta' },
		],
	},
	{
		id: 'hortifruti',
		tag: 'HORTIFRUTI',
		title: 'Frutas e verduras fresquinhas para sua casa',
		highlight: 'feira do dia',
		description:
			'Encontre frutas, verduras e legumes em uma parte separada para ficar mais facil de achar.',
		primaryCta: 'Montar lista',
		secondaryCta: 'Ver frutas e verduras',
		theme: 'fresh',
		visuals: [
			{ type: 'produce', label: 'Hortifruti' },
			{ type: 'bread', label: 'Padaria' },
		],
	},
	{
		id: 'whatsapp',
		tag: 'ATENDIMENTO RAPIDO',
		title: 'Fale no WhatsApp e resolva sua compra rapidinho',
		highlight: 'retire ou receba',
		description:
			'Escolha seus produtos, abra sua lista e envie tudo para a loja em uma mensagem pronta.',
		primaryCta: 'Falar agora',
		secondaryCta: 'Como comprar',
		theme: 'mint',
		visuals: [
			{ type: 'phone', label: 'WhatsApp' },
			{ type: 'delivery', label: 'Entrega' },
		],
	},
];

export const quickAccessItems = [
	{ title: 'Oferta do dia', subtitle: 'Preco baixo', icon: 'tag', href: '#ofertas' },
	{ title: 'Retire na loja', subtitle: 'Sem fila', icon: 'pickup', href: '#informacoes' },
	{ title: 'Frutas frescas', subtitle: 'Feira do dia', icon: 'produce', href: '#setor-hortifruti' },
	{ title: 'Padaria', subtitle: 'Pao quentinho', icon: 'bread', href: '#setor-padaria' },
	{ title: 'Limpeza', subtitle: 'Casa arrumada', icon: 'cleaner', href: '#setor-limpeza' },
	{ title: 'Sua lista', subtitle: 'Enviar no WhatsApp', icon: 'basket', href: '#lista' },
];

export const serviceHighlights = [
	{
		title: 'Busca facil',
		description: 'A busca fica em destaque para voce achar mais rapido o que precisa.',
		icon: 'search',
	},
	{
		title: 'Retirar sem fila',
		description: 'Monte o pedido e passe na loja para buscar no melhor horario.',
		icon: 'pickup',
	},
	{
		title: 'Receber em casa',
		description: 'Entrega local para deixar a compra do dia a dia bem mais simples.',
		icon: 'delivery',
	},
	{
		title: 'Oferta facil de ver',
		description: 'Preco grande, botao claro e tudo pensado para o celular.',
		icon: 'spark',
	},
];

export const trustHighlights = [
	{ title: 'Compra segura e acessivel', icon: 'shield' },
	{ title: 'Atendimento local no WhatsApp', icon: 'whatsapp' },
	{ title: 'Retirada na loja', icon: 'pickup' },
	{ title: 'Entrega sem contato', icon: 'delivery' },
];

export const aboutMetrics = [
	{ value: 'Busca fácil', label: 'Digite e encontre produtos em segundos.' },
	{ value: 'Setores claros', label: 'Cada parte da loja tem seu próprio espaço.' },
	{ value: 'Site leve', label: 'Abre rápido no celular, sem travar.' },
	{ value: 'Feito para celular', label: 'Botões grandes e navegação simples.' },
];

export const infoCards = [
	{ title: 'Horario de funcionamento', text: company.hours, icon: 'clock' },
	{ title: 'Endereco', text: company.address, icon: 'location' },
	{ title: 'Telefone', text: company.phone, icon: 'phone' },
	{ title: 'WhatsApp', text: company.whatsappDisplay, icon: 'whatsapp' },
	{ title: 'Retirar na loja', text: 'Seu pedido fica separado para voce buscar mais rapido.', icon: 'pickup' },
	{ title: 'Receber em casa', text: 'Entrega no bairro para ajudar na correria do dia a dia.', icon: 'delivery' },
	{ title: 'Entrega sem contato', text: 'Uma opcao pratica para quem quer mais rapidez.', icon: 'shield' },
	{ title: 'Atendimento facil', text: 'Textos simples e ajuda rapida direto no WhatsApp.', icon: 'support' },
];

export const buildWhatsAppLink = (message: string) =>
	`https://wa.me/${company.whatsappNumber}?text=${encodeURIComponent(message)}`;

