import styles from './page.module.css';

export default function DashboardPage() {
  return (
    <div className={styles.root}>
      <p className={styles.eyebrow}>Painel</p>
      <h1 className={styles.heading}>Seja bem-vindo</h1>
    </div>
  );
}
