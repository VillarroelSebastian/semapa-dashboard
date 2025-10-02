using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

public class MenuPrincipal : MonoBehaviour
{
    public void LoadMainScene()
    {
        SceneManager.LoadScene("MainScene");
    }

    public void ExitGame()
    {
        #if UNITY_EDITOR
                    // Si estamos en el editor de Unity, simplemente detendremos el juego
                    UnityEditor.EditorApplication.isPlaying = false;
        #else
                // Si estamos en una compilación, cerramos la aplicación
                Application.Quit();
        #endif
    }
}
