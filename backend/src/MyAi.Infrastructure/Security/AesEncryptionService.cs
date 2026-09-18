using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using MyAi.Application.Interfaces;

namespace MyAi.Infrastructure.Security;

/// <summary>AES-GCM encryption for API keys at rest. Key from configuration (use env var / secret store in prod).</summary>
public class AesEncryptionService : IEncryptionService
{
    private readonly byte[] _key;

    public AesEncryptionService(IConfiguration config)
    {
        var secret = config["Encryption:Key"] ?? "MyAi-Dev-Only-Change-Me-32bytes!!";
        _key = SHA256.HashData(Encoding.UTF8.GetBytes(secret));
    }

    public byte[] Encrypt(string plain)
    {
        var nonce = RandomNumberGenerator.GetBytes(AesGcm.NonceByteSizes.MaxSize);
        var plainBytes = Encoding.UTF8.GetBytes(plain);
        var cipher = new byte[plainBytes.Length];
        var tag = new byte[AesGcm.TagByteSizes.MaxSize];
        using var aes = new AesGcm(_key, AesGcm.TagByteSizes.MaxSize);
        aes.Encrypt(nonce, plainBytes, cipher, tag);
        var result = new byte[nonce.Length + tag.Length + cipher.Length];
        Buffer.BlockCopy(nonce, 0, result, 0, nonce.Length);
        Buffer.BlockCopy(tag, 0, result, nonce.Length, tag.Length);
        Buffer.BlockCopy(cipher, 0, result, nonce.Length + tag.Length, cipher.Length);
        return result;
    }

    public string Decrypt(byte[] cipher)
    {
        var nonceSize = AesGcm.NonceByteSizes.MaxSize;
        var tagSize = AesGcm.TagByteSizes.MaxSize;
        var nonce = cipher.AsSpan(0, nonceSize);
        var tag = cipher.AsSpan(nonceSize, tagSize);
        var data = cipher.AsSpan(nonceSize + tagSize);
        var plain = new byte[data.Length];
        using var aes = new AesGcm(_key, AesGcm.TagByteSizes.MaxSize);
        aes.Decrypt(nonce, data, tag, plain);
        return Encoding.UTF8.GetString(plain);
    }
}
