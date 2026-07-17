import { redirect } from 'next/navigation';

/** Root → matches schedule (sports landing) */
export default function HomePage() {
  redirect('/matches');
}
