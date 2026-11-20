import { randomUUID } from 'node:crypto'

const products = [
  ['Fone Bluetooth dobrável', 129.90, 32, 'Áudio', '🎧'],
  ['Cafeteira compacta', 189.90, 25, 'Cozinha', '☕'],
  ['Mochila urbana impermeável', 119.90, 30, 'Acessórios', '🎒'],
  ['Luminária de mesa LED', 69.90, 18, 'Casa', '💡'],
  ['Kit de panelas antiaderentes', 239.90, 28, 'Cozinha', '🍳'],
  ['Monitor portátil Full HD', 449.90, 20, 'Tecnologia', '🖥️'],
  ['Garrafa térmica inox', 84.90, 35, 'Esporte', '🧊'],
  ['Tênis de corrida leve', 149.90, 26, 'Esporte', '👟'],
  ['Chaleira elétrica 1,7 L', 109.90, 21, 'Cozinha', '🫖'],
  ['Caixa de som portátil', 139.90, 22, 'Áudio', '🔊'],
  ['Carregador USB-C 65 W', 89.90, 31, 'Tecnologia', '🔌'],
  ['Kit de ferramentas manuais', 94.90, 19, 'Ferramentas', '🛠️']
]

export function scrapeShopeeMock() {
  return products.map(([title, price, discount, category, icon], index) => ({
    title, price, discount, category, image: null, icon,
    demand: index % 3 === 0 ? 'Alta' : 'Estável',
    stock: 32 + index * 13,
    destination: 'https://shopee.com.br/search?keyword=' + encodeURIComponent(title)
  }))
}

export function demoIcon(title) {
  return products.find(product => product[0] === title)?.[4] || '📦'
}

export async function seedDemoOffers(database) {
  await database.transaction(async db => {
    const { rows } = await db.query('SELECT id FROM offers LIMIT 1')
    if (rows.length) return
    for (const offer of scrapeShopeeMock()) {
      await db.query(
        `INSERT INTO offers (id,title,price,discount,category,image_url,marketplace,demand_level,stock_level,destination_url)
         VALUES ($1,$2,$3,$4,$5,$6,'Shopee',$7,$8,$9)`,
        [randomUUID(), offer.title, offer.price, offer.discount, offer.category, offer.image,
          offer.demand, offer.stock, offer.destination])
    }
  })
}
