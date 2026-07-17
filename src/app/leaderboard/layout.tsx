import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CineRank Leaderboard — Top Watch-Party Fans | MatchDay',
  description: 'See who watches the most on MatchDay! Global rankings by watch hours, rooms created, messages, and more. Earn your CineRank — from Newcomer to Cinema Legend.',
  keywords: ['watch party leaderboard', 'matchday rankings', 'movie watchers leaderboard', 'watch hours ranking', 'cinerank'],
  openGraph: {
    title: 'CineRank Leaderboard | MatchDay',
    description: 'Who are the top MatchDay fans? See global rankings by watch time, rooms created, and more.',
    type: 'website',
  },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
