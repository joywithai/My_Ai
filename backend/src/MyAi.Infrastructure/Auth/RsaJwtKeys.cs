using System.Security.Cryptography;

namespace MyAi.Infrastructure.Auth;

/// <summary>
/// RS256 signing keys (README §3.4). Loads keys/jwt_rsa.pem; first run generates
/// and persists the pair so tokens survive restarts. In production mount this
/// file (or a certificate) — never commit it.
/// </summary>
public static class RsaJwtKeys
{
    public static (RSA privateRsa, RSAParameters publicKey) LoadOrCreate(string contentRoot)
    {
        var dir = Path.Combine(contentRoot, "keys");
        Directory.CreateDirectory(dir);
        var file = Path.Combine(dir, "jwt_rsa.pem");

        string pem;
        if (File.Exists(file))
        {
            pem = File.ReadAllText(file);
        }
        else
        {
            using var gen = RSA.Create(2048);
            pem = gen.ExportPkcs8PrivateKeyPem();
            File.WriteAllText(file, pem);
            try { File.WriteAllText(file + ".pub", gen.ExportSubjectPublicKeyInfoPem()); } catch { /* pub is informational */ }
        }

        var priv = RSA.Create();
        priv.ImportFromPem(pem);
        return (priv, priv.ExportParameters(includePrivateParameters: false));
    }
}
