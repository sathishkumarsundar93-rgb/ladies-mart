import PageShell from "../components/PageShell";
import ProductGrid from "../components/ProductGrid";
export default function WishlistPage(){return <PageShell title="Your wishlist"><p className="inner-lead">Keep the styles you love in one place. This preview shows sample saved favourites.</p><ProductGrid ids={[1,3,6]}/></PageShell>}
