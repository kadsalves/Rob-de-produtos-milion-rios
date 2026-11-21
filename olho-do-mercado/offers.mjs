export const offers = [
  { id: 1, name: 'Fone Bluetooth dobrável', category: 'Áudio', icon: '🎧', price: 129.90, previous: 189.90 },
  { id: 2, name: 'Cafeteira compacta', category: 'Cozinha', icon: '☕', price: 189.90, previous: 249.90 },
  { id: 3, name: 'Mochila urbana', category: 'Acessórios', icon: '🎒', price: 119.90, previous: 169.90 },
  { id: 4, name: 'Luminária de mesa LED', category: 'Casa', icon: '💡', price: 69.90, previous: 89.90 },
  { id: 5, name: 'Kit de panelas antiaderentes', category: 'Cozinha', icon: '🍳', price: 239.90, previous: 329.90 },
  { id: 6, name: 'Monitor portátil Full HD', category: 'Tecnologia', icon: '🖥️', price: 449.90, previous: 559.90 },
  { id: 7, name: 'Garrafa térmica inox', category: 'Casa', icon: '🧊', price: 84.90, previous: 129.90 },
  { id: 8, name: 'Tênis de corrida leve', category: 'Esporte', icon: '👟', price: 149.90, previous: 199.90 },
  { id: 9, name: 'Chaleira elétrica 1,7 L', category: 'Cozinha', icon: '🫖', price: 109.90, previous: 139.90 },
  { id: 10, name: 'Caixa de som portátil', category: 'Áudio', icon: '🔊', price: 139.90, previous: 179.90 },
  { id: 11, name: 'Carregador USB-C 65 W', category: 'Tecnologia', icon: '🔌', price: 89.90, previous: 129.90 },
  { id: 12, name: 'Kit de ferramentas manuais', category: 'Ferramentas', icon: '🛠️', price: 94.90, previous: 119.90 }
]

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
export const money = price => currency.format(price)
export const discount = ({ price, previous }) => Math.round((previous - price) / previous * 100)
const normalize = value => value.trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')

export function searchOffers(query) {
  const term = normalize(query)
  return offers.filter(offer => normalize(offer.name + ' ' + offer.category).includes(term))
}

export function prepareOffer(offer) {
  const { name, price, previous } = offer
  return {
    link: 'https://shopee.com.br/search?keyword=' + encodeURIComponent(name),
    copies: {
      emocional: `Sabe quando um achado combina com o que você precisava? Dá uma olhada nos detalhes de ${name} e veja se ele faz sentido para a sua rotina. Confira no link.`,
      urgencia: `Está de olho em ${name}? Vale conferir na loja o preço e a disponibilidade antes de decidir. As condições podem mudar. Veja os detalhes no link.`,
      barganha: `Neste exemplo, ${name} passa de ${money(previous)} para ${money(price)}, uma diferença de ${discount(offer)}%. Confira na loja o preço atual e o valor final com frete.`
    }
  }
}
