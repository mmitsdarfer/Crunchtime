# Crunch Time

Crunch Time is a webapp that scrapes sports scores so users can sort them by various criteria
and be directed to streaming links.

I made this program on my own as a way to automate the process of finding streaming games based on personal preferences and the current scores. Pre-selecting priorities and preferences allows the user to go from the home page to the stream of the game they would choose in one click.

The user can organize games based on how close the scores are, how much time is left in the game, and team standings. These 3 criteria are ranked, so if 2 games match the user's next priority will be used to break the tie. The games are sorted and shown and if the user enables "Take me out to the ball (or puck) game" mode, they will be redirected to the proper streaming site. Users can also define the streaming services they have to only be taken to games they can watch. Other customizations include how often to refresh scores and tracking the number of visits to each league page.

## Requirements
Crunch Time requires the following to run:
* [Node.js](https://nodejs.org/en)
* [npm](https://www.npmjs.com/)
* [express](https://expressjs.com/)
* [React](https://react.dev/)
* [concurrently](https://www.npmjs.com/package/concurrently)
* [cors](https://www.npmjs.com/package/cors)
* [react-router-dom](https://www.npmjs.com/package/react-router-dom)
* [cookie-parser](https://www.npmjs.com/package/cookie-parser)
* [puppeteer](https://pptr.dev/)
* [react-cookie](https://www.npmjs.com/package/react-cookie)


## Usage/Examples

Concurrently is used to start the server and client at once with:
```javascript
npm start
```
The client is run on localhost:3000 which starts on the home page of Crunch Time.


## Author

[@mmitsdarfer](https://www.github.com/mmitsdarfer)

