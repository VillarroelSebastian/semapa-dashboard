using UnityEngine;
using UnityEngine.UI;

public class PointManager : MonoBehaviour
{
    public static PointManager instance;

    public Text scoreTextP1; 
    public Text scoreTextP2; 

    private int scoreP1 = 0;
    private int scoreP2 = 0;

    void Awake()
    {
        if (instance == null) instance = this;
    }

    public void AddPointToP1()
    {
        scoreP1++;
        scoreTextP1.text = "Player 1: " + scoreP1;
    }

    public void AddPointToP2()
    {
        scoreP2++;
        scoreTextP2.text = "Player 2: " + scoreP2;
    }
}
