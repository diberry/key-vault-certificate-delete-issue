const { CertificateClient, DefaultCertificatePolicy } = require("@azure/keyvault-certificates");
const { DefaultAzureCredential } = require("@azure/identity");

console.log(process.env.AZURE_LOG_LEVEL);

async function main() {
  // If you're using MSI, DefaultAzureCredential should "just work".
  // Otherwise, DefaultAzureCredential expects the following three environment variables:
  // - AZURE_TENANT_ID: The tenant ID in Azure Active Directory
  // - AZURE_CLIENT_ID: The application (client) ID registered in the AAD tenant
  // - AZURE_CLIENT_SECRET: The client secret for the registered application
  const credential = new DefaultAzureCredential();

  const keyVaultName = process.env["KEY_VAULT_NAME"];
  if(!keyVaultName) throw new Error("KEY_VAULT_NAME is empty");

  const url = "https://" + keyVaultName + ".vault.azure.net";
  const client = new CertificateClient(url, credential);

  const uniqueString = new Date().getTime();
  const certificateName = `cert${uniqueString}`;

  // Creating a self-signed certificate
  const createPoller = await client.beginCreateCertificate(
    certificateName,
    DefaultCertificatePolicy
  );

  const pendingCertificate = createPoller.getResult();
  console.log("Certificate: ", pendingCertificate);

  // To read a certificate with their policy:
  let certificateWithPolicy = await client.getCertificate(certificateName);
  // Note: It will always read the latest version of the certificate.

  console.log("Certificate with policy:", certificateWithPolicy);

  // To read a certificate from a specific version:
  const certificateFromVersion = await client.getCertificateVersion(
    certificateName,
    certificateWithPolicy.properties.version
  );
  // Note: It will not retrieve the certificate's policy.
  console.log("Certificate from a specific version:", certificateFromVersion);

  const updatedCertificate = await client.updateCertificateProperties(certificateName, "", {
    tags: {
      customTag: "value"
    }
  });
  console.log("Updated certificate:", updatedCertificate);

  // Updating the certificate's policy:
  await client.updateCertificatePolicy(certificateName, {
    issuerName: "Self",
    subject: "cn=MyOtherCert"
  });
  certificateWithPolicy = await client.getCertificate(certificateName);
  console.log("updatedCertificate certificate's policy:", certificateWithPolicy.policy);

  console.log(`certificateName=${certificateName}`)

  // delete certificate
  try{
  const deletePoller = await client.beginDeleteCertificate(certificateName);
  console.log(`deletePoller fetched`)


  console.log(`${(new Date(Date.now())).toISOString()}`);
  const deletedCertificate = await deletePoller.pollUntilDone();
  console.log(`${(new Date(Date.now())).toISOString()}`);

  console.log(`deletedCertificate fetched}`)

  console.log("Recovery Id: ", deletedCertificate.recoveryId);
  console.log("Deleted Date: ", deletedCertificate.deletedOn);
  console.log("Scheduled Purge Date: ", deletedCertificate.scheduledPurgeDate);
  } catch (error){
    console.log(error)
  }
}

main().catch((error) => {
  console.error("An error occurred:", error);
  process.exit(1);
});