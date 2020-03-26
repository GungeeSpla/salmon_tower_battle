export const SCENE_SIGN_IN = {
  /** label */
  label: 'sign-in',

  /** enter() */
  enter() {
    const defaultOption = {
      layer: 0,
      x: '50%',
      width: 600,
      centering: true,
      style: {
        color: '#000000',
        position: 'absolute',
        'font-size': '60px',
        'line-height': '100%',
        margin: '0',
        'text-align': 'center',
      },
    };
    this.append('div', 'sign-in-with-twitter', defaultOption, {
      y: 100,
      onclick: () => {

      },
    });
    this.append('div', 'go-title', defaultOption, {
      y: 200,
      jump: 'title',
    });
  },

  /** leave() */
  leave() {
  },
};
