export interface CatalogProduct {
	name: string;
	description: string;
	price: number;
	oldPrice: number;
	unit: string;
	badge: string;
	visual: string;
	brand: string;
	productType: string;
	sector: string;
	tags: string[];
}

interface ProductTab {
	id: string;
	label: string;
	products: CatalogProduct[];
}

const buildProductTags = (sector: string, productType: string, brand: string, extras: string[] = []) =>
	Array.from(
		new Set(
			[
				sector,
				productType,
				brand,
				`setor ${sector}`,
				`tipo ${productType}`,
				`marca ${brand}`,
				...extras,
			].map((value) => value.toLowerCase())
		)
	);

export const productTabs: ProductTab[] = [
	{
		id: 'destaques',
		label: 'Destaques do dia',
		products: [
			{
				name: 'Arroz Tipo 1 5kg',
				description: 'Item basico para a semana.',
				price: 23.9,
				oldPrice: 29.9,
				unit: 'Pacote 5kg',
				badge: 'Oferta',
				visual: 'rice',
				brand: 'Camil',
				productType: 'Arroz',
				sector: 'Mercearia',
				tags: buildProductTags('Mercearia', 'Arroz', 'Camil', ['graos', 'despensa']),
			},
			{
				name: 'Feijao Carioca 1kg',
				description: 'Bom preco para sua despensa.',
				price: 7.49,
				oldPrice: 9.99,
				unit: 'Pacote 1kg',
				badge: 'Mais pedido',
				visual: 'beans',
				brand: 'Kicaldo',
				productType: 'Feijao',
				sector: 'Mercearia',
				tags: buildProductTags('Mercearia', 'Feijao', 'Kicaldo', ['graos', 'despensa']),
			},
			{
				name: 'Leite Integral 1L',
				description: 'Leite para o dia a dia.',
				price: 4.39,
				oldPrice: 5.49,
				unit: 'Caixa 1L',
				badge: 'Todo dia',
				visual: 'milk',
				brand: 'Italac',
				productType: 'Leite',
				sector: 'Laticinios',
				tags: buildProductTags('Laticinios', 'Leite', 'Italac', ['integral', 'caixa']),
			},
			{
				name: 'Refrigerante 2L',
				description: 'Ideal para o fim de semana.',
				price: 8.49,
				oldPrice: 10.99,
				unit: 'Garrafa 2L',
				badge: 'Promo',
				visual: 'bottle',
				brand: 'Coca-Cola',
				productType: 'Refrigerante',
				sector: 'Bebidas',
				tags: buildProductTags('Bebidas', 'Refrigerante', 'Coca-Cola', ['soda', 'garrafa']),
			},
		],
	},
	{
		id: 'hortifruti',
		label: 'Frutas e verduras',
		products: [
			{
				name: 'Banana Prata',
				description: 'Boa para o cafe e o lanche.',
				price: 4.98,
				oldPrice: 6.99,
				unit: 'Kg',
				badge: 'Fresco',
				visual: 'produce',
				brand: 'Horta Fresca',
				productType: 'Frutas',
				sector: 'Hortifruti',
				tags: buildProductTags('Hortifruti', 'Frutas', 'Horta Fresca', ['banana', 'feira']),
			},
			{
				name: 'Tomate',
				description: 'Bom para salada e molho.',
				price: 5.79,
				oldPrice: 8.49,
				unit: 'Kg',
				badge: 'Oferta',
				visual: 'produce',
				brand: 'Horta Fresca',
				productType: 'Legumes',
				sector: 'Hortifruti',
				tags: buildProductTags('Hortifruti', 'Legumes', 'Horta Fresca', ['tomate', 'feira']),
			},
			{
				name: 'Laranja Pera',
				description: 'Boa para suco natural.',
				price: 4.29,
				oldPrice: 5.99,
				unit: 'Kg',
				badge: 'Leve mais',
				visual: 'produce',
				brand: 'Fazenda Sol',
				productType: 'Frutas',
				sector: 'Hortifruti',
				tags: buildProductTags('Hortifruti', 'Frutas', 'Fazenda Sol', ['laranja', 'suco']),
			},
			{
				name: 'Batata Lavada',
				description: 'Facil para cozinhar em casa.',
				price: 4.89,
				oldPrice: 6.39,
				unit: 'Kg',
				badge: 'Dia a dia',
				visual: 'produce',
				brand: 'Sacolao Bom Preco',
				productType: 'Legumes',
				sector: 'Hortifruti',
				tags: buildProductTags('Hortifruti', 'Legumes', 'Sacolao Bom Preco', ['batata', 'cozinha']),
			},
		],
	},
	{
		id: 'padaria',
		label: 'Padaria',
		products: [
			{
				name: 'Pao Frances',
				description: 'Pao quentinho para todo dia.',
				price: 12.9,
				oldPrice: 15.9,
				unit: 'Pacote',
				badge: 'Quentinho',
				visual: 'bread',
				brand: 'Padaria da Casa',
				productType: 'Paes',
				sector: 'Padaria',
				tags: buildProductTags('Padaria', 'Paes', 'Padaria da Casa', ['pao', 'frances']),
			},
			{
				name: 'Bolo Caseiro',
				description: 'Bom para o cafe da tarde.',
				price: 18.9,
				oldPrice: 22.9,
				unit: 'Unidade',
				badge: 'Feito hoje',
				visual: 'bread',
				brand: 'Bauduco',
				productType: 'Bolos',
				sector: 'Padaria',
				tags: buildProductTags('Padaria', 'Bolos', 'Bauduco', ['bolo', 'cafe da tarde']),
			},
			{
				name: 'Pao de Forma Bauduco',
				description: 'Facil de montar lanche em casa.',
				price: 13.9,
				oldPrice: 17.9,
				unit: 'Pacote',
				badge: 'Praticidade',
				visual: 'bread',
				brand: 'Bauduco',
				productType: 'Paes',
				sector: 'Padaria',
				tags: buildProductTags('Padaria', 'Paes', 'Bauduco', ['pao de forma', 'lanche']),
			},
			{
				name: 'Combo Cafe da Manha',
				description: 'Leve mais itens e economize.',
				price: 29.9,
				oldPrice: 35.9,
				unit: 'Kit',
				badge: 'Combo',
				visual: 'basket',
				brand: 'Padaria da Casa',
				productType: 'Kit cafe',
				sector: 'Padaria',
				tags: buildProductTags('Padaria', 'Kit cafe', 'Padaria da Casa', ['combo', 'manha']),
			},
		],
	},
	{
		id: 'limpeza',
		label: 'Limpeza',
		products: [
			{
				name: 'Detergente Lava-Loucas',
				description: 'Item basico para a pia.',
				price: 2.89,
				oldPrice: 3.79,
				unit: 'Unidade',
				badge: 'Preco baixo',
				visual: 'cleaner',
				brand: 'Ype',
				productType: 'Detergente',
				sector: 'Limpeza',
				tags: buildProductTags('Limpeza', 'Detergente', 'Ype', ['loucas', 'cozinha']),
			},
			{
				name: 'Sabao em Po 1kg',
				description: 'Bom para lavar roupa.',
				price: 11.9,
				oldPrice: 14.9,
				unit: 'Pacote 1kg',
				badge: 'Oferta',
				visual: 'cleaner',
				brand: 'Omo',
				productType: 'Sabao em po',
				sector: 'Limpeza',
				tags: buildProductTags('Limpeza', 'Sabao em po', 'Omo', ['roupa', 'lavanderia']),
			},
			{
				name: 'Desinfetante 2L',
				description: 'Ajuda a manter a casa limpa.',
				price: 7.99,
				oldPrice: 10.49,
				unit: 'Frasco 2L',
				badge: 'Casa em ordem',
				visual: 'cleaner',
				brand: 'Veja',
				productType: 'Desinfetante',
				sector: 'Limpeza',
				tags: buildProductTags('Limpeza', 'Desinfetante', 'Veja', ['piso', 'banheiro']),
			},
			{
				name: 'Kit Multiuso',
				description: 'Varios itens em um so pacote.',
				price: 19.9,
				oldPrice: 26.9,
				unit: 'Combo',
				badge: 'Kit',
				visual: 'basket',
				brand: 'Bombril',
				productType: 'Kit limpeza',
				sector: 'Limpeza',
				tags: buildProductTags('Limpeza', 'Kit limpeza', 'Bombril', ['multiuso', 'combo']),
			},
		],
	},
];
