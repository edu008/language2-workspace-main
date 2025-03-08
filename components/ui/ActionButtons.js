// components/ActionButtons.js
import React from "react";
import styles from "../../styles/ActionButtons.module.css";

export default function ActionButtons({ onCorrect, onIncorrect, isLoading }) {
  return (
    <div className={styles.actionButtonsContainer}>
      <div className={styles.buttonGrid}>
        <button
          onClick={onCorrect}
          disabled={isLoading}
          className={styles.correctButton}
          aria-label="Richtig"
        >
          Richtig
        </button>
        <button
          onClick={onIncorrect}
          disabled={isLoading}
          className={styles.incorrectButton}
          aria-label="Falsch"
        >
          Falsch
        </button>
      </div>
    </div>
  );
}
