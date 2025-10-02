using UnityEngine;

public class PG_BallController : MonoBehaviour
{
    public float speed = 8f; // velocidad inicial
    private Rigidbody2D rb;

    void Start()
    {
        rb = GetComponent<Rigidbody2D>();

        // Dar un empujón inicial aleatorio
        LaunchBall();
    }

    void LaunchBall()
    {
        // Dirección aleatoria izquierda o derecha
        float x = Random.Range(0, 2) == 0 ? -1 : 1;
        float y = Random.Range(-1f, 1f);

        Vector2 direction = new Vector2(x, y).normalized;
        rb.velocity = direction * speed;
    }

    public void ResetBall()
    {
        // Reinicia en el centro con nueva dirección
        transform.position = Vector2.zero;
        LaunchBall();
    }
}
