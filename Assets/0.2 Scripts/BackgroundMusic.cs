using UnityEngine;

public class BackgroundMusic : MonoBehaviour
{
    public AudioClip musicClip;   // 🎵 La canción que asignarás en el inspector
    private AudioSource audioSource;

    void Awake()
    {
        // Asegurarnos de que el objeto no se destruya al cambiar de escena
        DontDestroyOnLoad(gameObject);

        // Configurar AudioSource
        audioSource = gameObject.AddComponent<AudioSource>();
        audioSource.clip = musicClip;
        audioSource.loop = true;        // Repetir la canción en bucle
        audioSource.playOnAwake = true; // Reproducir automáticamente al iniciar
        audioSource.volume = 0.5f;      // Ajusta volumen a tu gusto

        audioSource.Play();
    }
}
