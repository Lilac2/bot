module.exports = {
  type: "service_account",
  project_id: "lilac2-rewrite",
  private_key_id: "d42805f2a47da59d4e0a011288099d3308e7165d",
  private_key: `-----BEGIN PRIVATE KEY-----\n${process.env.DB_PRIVATE_KEY}\n-----END PRIVATE KEY-----\n`,
  client_email: "lilac2-bot@lilac2-rewrite.iam.gserviceaccount.com",
  client_id: "100992491413768252950",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/lilac2-bot%40lilac2-rewrite.iam.gserviceaccount.com"
}
