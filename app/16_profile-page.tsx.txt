import Link from "next/link";
import { UserRound, Package, MapPin, Heart, CreditCard, HelpCircle, ChevronRight } from "lucide-react";
import PageShell from "../components/PageShell";
const links=[["My orders",Package,"/cart"],["Saved addresses",MapPin,"#"],["Wishlist",Heart,"/wishlist"],["Payment methods",CreditCard,"#"],["Help & support",HelpCircle,"#"]];
export default function ProfilePage(){return <PageShell title="My account"><div className="profile-card"><div className="avatar"><UserRound/></div><div><h2>Welcome to Ladies Mart</h2><p className="muted">Sign in to manage your account and orders.</p><Link className="solid-action" href="/login">Login / Create account</Link></div></div><div className="profile-menu">{links.map(([label,Icon,href]:any)=><Link href={href} key={label}><Icon size={19}/>{label}<ChevronRight size={17}/></Link>)}</div></PageShell>}
