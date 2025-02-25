import styles from "../../styles/ActionButtons.module.css";

export default function ActionButtons({ onCorrect, onIncorrect, isLoading }) {
  return (
    <div className={styles.actionButtonsContainer}>
      <div className={styles.buttonGrid}>
        <button
          onClick={onCorrect}
          disabled={isLoading}
          className={styles.correctButton}
        >
          Richtig
        </button>
        <button
          onClick={onIncorrect}
          disabled={isLoading}
          className={styles.incorrectButton}
        >
          Falsch
        </button>
      </div>
    </div>
  );
}