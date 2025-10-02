using UnityEngine;

public class PG_Player1Controller : MonoBehaviour
{
    public float speed = 10f; // Velocidad del movimiento

    private Rigidbody2D rb;

    void Start()
    {
        rb = GetComponent<Rigidbody2D>();
    }

    void Update()
    {
        float move = 0f;

        // Movimiento con W (arriba) y S (abajo)
        if (Input.GetKey(KeyCode.W))
        {
            move = 1f;
        }
        else if (Input.GetKey(KeyCode.S))
        {
            move = -1f;
        }

        rb.velocity = new Vector2(0, move * speed);
    }
}
