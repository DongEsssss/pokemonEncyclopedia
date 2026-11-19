import Image from 'next/image';
import styles from './PokemonRelease.module.css';

export default function PokemonRelease({ src, size }: { src?: string | null; size: number }) {
  return (
    <span className={styles.release} style={{ width: size, height: size }} aria-hidden="true">
      <span className={styles.ball} />
      <span className={styles.flash} />
      {src && <Image className={styles.sprite} src={src} alt="" width={size} height={size} unoptimized />}
    </span>
  );
}
