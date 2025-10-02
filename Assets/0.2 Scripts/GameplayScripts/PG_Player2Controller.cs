using UnityEngine;

public class PG_Player2Controller : MonoBehaviour
{
    public float speed = 10f;

    private Rigidbody2D rb;

    void Start()
    {
        rb = GetComponent<Rigidbody2D>();
    }

    void Update()
    {
        float move = 0f;

        // Movimiento con Flechas
        if (Input.GetKey(KeyCode.UpArrow))
        {
            move = 1f;
        }
        else if (Input.GetKey(KeyCode.DownArrow))
        {
            move = -1f;
        }

        rb.velocity = new Vector2(0, move * speed);
    }
}
