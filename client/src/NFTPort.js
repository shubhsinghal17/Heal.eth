export const PRIVATE_API_KEY = process.env.NFTPORT_API
export const COVALENT_APIKEY = process.env.COVALENT_APIKEY
import mintFromNFTPort from './components/integrations/NFTPort'

const DoctorNFTContract = ({
    chain,
    patient_name,
    symbol,
    patient_address,
    metadata_updatable
}) => {
    fetch('https://api.nftport.xyz/v0/contracts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: PRIVATE_API_KEY,
        },
        body: JSON.stringify({
            chain,
            patient_name,
            symbol,
            patient_address,
            metadata_updatable,
        }),
    })
        .then((response) => response.json())
        .then((response) => {
            console.log(response);
        })
        .catch((err) => {
            console.error(err);
        });
}

const patientNFTMetadata = ({
    chain,
    patient_name,
    symbol,
    patient_address,
    metadata_updatable
}) => {
    fetch('https://api.nftport.xyz/v0/contracts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: PRIVATE_API_KEY,
        },
        body: JSON.stringify({
            chain,
            patient_name,
            symbol,
            patient_address,
            metadata_updatable,
        }),
    })
        .then((response) => response.json())
        .then((response) => {
            console.log(response);
        })
        .catch((err) => {
            console.error(err);
        });
}

const mintNFT = ({
    chain,
    patient_name,
    doctor_address,
    symbol1,
    symbol2,
    patient_address,
    metadata_updatable
}) => {
    mintFromNFTPort(patient_address, doctor_address, symbol1, symbol2, metadata_updatable);
    fetch('https://api.nftport.xyz/v0/contracts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: PRIVATE_API_KEY,
        },
        body: JSON.stringify({
            chain,
            patient_name,
            symbol,
            patient_address,
            metadata_updatable,
        }),
    })
        .then((response) => response.json())
        .then((response) => {
            console.log(response);
        })
        .catch((err) => {
            console.error(err);
        });
}


export {
    mintNFT,
    DoctorNFTContract,
    patientNFTMetadata
};
