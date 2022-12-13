const mintFromNFTPort = async (
  patient_address,
  doctorAddress,
  patient_token_id,
  doctor_token_id,
  metadataURI
) => {
    const headers = {
    accept: "application/json",
    "content-type": "application/json",
    Authorization: "ed2d57d9-c69c-41df-9243-c92747e80dac",
  };
  const url = "https://api.nftport.xyz/v0/mints/customizable/batch";
  const data = {
    tokens: [
      {
        mint_to_address: patient_address,
        token_id: patient_token_id,
        metadata_uri: metadataURI,
        quantity: 1,
      },
      {
        mint_to_address: doctorAddress,
        token_id: doctor_token_id,
        metadata_uri: metadataURI,
        quantity: 1,
      },
    ],
    chain: "polygon",
    contract_address: "0xbb3aa6009df7dda5763ed2ed77b6d19e9384d955",
  };
  try {
    const response = await fetch(url, {
      headers: headers,
      method: "POST",
      body: JSON.stringify(data),
    });
    const res = await response.json();
    return res;
  } catch (error) {
    console.log(error);
  }
  return "Doctor to Patient NFTs connected using NFTPort!";
};

export { mintFromNFTPort };
