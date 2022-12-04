
import { defaultAbiCoder as abi } from "@ethersproject/abi";
import { keccak256 } from "@ethersproject/solidity";
import worldID from "@worldcoin/id";
import React, { useEffect } from "react";
import { user_contract } from "../constants/contract_addresses";

const hashBytes = (input) => {
  return abi.encode(
    ["uint256"],
    [BigInt(keccak256(["bytes"], [input])) >> BigInt(8)]
  );
};

export default function WorldIDComponent({ signal, setProof }) {

  useEffect(() => {

    const WorldIDenabler = async () => {
      try {
        const result = await worldID.enable();
        setProof(result);
        console.log("World ID verified successfully: ", result);
      } catch (error) {
        console.error(error);
        WorldIDenabler().catch(console.error.bind(console));
      }
    };

    if (!worldID.isInitialized()) {
      worldID.init("world-id-container", {
        actionId: hashBytes(user_contract),
        signal,
      });
    }
    if (!worldID.isEnabled()) {
      WorldIDenabler().catch(console.error.bind(console));
    }
  }, []);

  return <div id="world-id-container" />;
};