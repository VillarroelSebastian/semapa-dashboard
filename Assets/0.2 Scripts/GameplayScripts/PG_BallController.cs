using UnityEngine;

public class PG_BallController : MonoBehaviour
{
    public float speed = 8f; 
    private Rigidbody2D rb;
    private Vector2 startPosition; 

    void Start()
    {
        rb = GetComponent<Rigidbody2D>();
        startPosition = transform.position; 

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
     
        transform.position = startPosition;
        LaunchBall();
    }
}
