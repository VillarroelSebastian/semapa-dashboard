
using UnityEngine;

public class WallPoint : MonoBehaviour
{
    public enum WallOwner { Player1, Player2 }
    public WallOwner wallOwner;

    private void OnTriggerEnter2D(Collider2D collision)
    {
        if (!collision.CompareTag("Ball")) return;

        if (wallOwner == WallOwner.Player1)
            PointManager.instance.AddPointToP1();
        else
            PointManager.instance.AddPointToP2();

        var ball = collision.GetComponent<PG_BallController>();
        if (ball != null) ball.ResetBall();
    }
}
