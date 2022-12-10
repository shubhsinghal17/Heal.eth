import React from "react";
import { Button } from "web3uikit";
import styles from "../styles/Home.module.css";
import { useRouter } from "next/router";

export default function GoToWorldCoin({ showWorldCoin, setShowWorldCoin }) {
  const router = useRouter();

  // function routeToWorldCoin() {
  //   router.push("/worldcoin");
  // }

  function toggleShowWorldCoin() {
    setShowWorldCoin(!showWorldCoin)
  }

  return (
    <div className={styles.userDisplay}>
      <Button
        color="white"
        icon="eye"
        id="test-button-primary-icon-only"
        onClick={toggleShowWorldCoin}
        size="medium"
        type="button"
        text="Verify"
      />
    </div>
  );
}