using UnityEngine;

public class WallPoint : MonoBehaviour
{
    public enum WallOwner { Player1, Player2 }
    public WallOwner wallOwner;

    private void OnTriggerEnter2D(Collider2D collision)
    {
        if (collision.CompareTag("Ball"))
        {
            if (wallOwner == WallOwner.Player1)
            {
                PointManager.instance.AddPointToP1();
            }
            else if (wallOwner == WallOwner.Player2)
            {
                PointManager.instance.AddPointToP2();
            }
        }
    }
}
