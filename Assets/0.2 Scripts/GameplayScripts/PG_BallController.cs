using UnityEngine;

public class PG_BallController : MonoBehaviour
{
    public float speed = 8f;
    private Rigidbody2D rb;
    private Vector2 startPosition;

    [Header("Sonido")]
    public AudioClip bounceClip;
    private AudioSource audioSource;

    void Start()
    {
        rb = GetComponent<Rigidbody2D>();
        startPosition = transform.position;


        audioSource = gameObject.AddComponent<AudioSource>();
        audioSource.playOnAwake = false;
        audioSource.volume = 0.7f;


        audioSource.hideFlags = HideFlags.HideInInspector;

        LaunchBall();
    }

    void LaunchBall()
    {
        float x = Random.Range(0, 2) == 0 ? -1 : 1;
        float y = Random.Range(-1f, 1f);
        Vector2 direction = new Vector2(x, y).normalized;
        rb.velocity = direction * speed;
    }

    public void ResetBall()
    {
        rb.velocity = Vector2.zero;
        transform.position = startPosition;

      
        speed = 8f;
        LaunchBall();
    }

    private void OnCollisionEnter2D(Collision2D collision)
    {
        if (bounceClip != null)
        {
            audioSource.PlayOneShot(bounceClip);
        }

     
        rb.velocity = rb.velocity.normalized * (rb.velocity.magnitude + 0.5f);
    }
}
