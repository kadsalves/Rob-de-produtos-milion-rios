export function ProductImage({ image, icon, title }) {
  return <div className="product-image">
    {image ? <img src={image} alt={title} loading="lazy" /> : <span aria-hidden="true">{icon}</span>}
  </div>
}
