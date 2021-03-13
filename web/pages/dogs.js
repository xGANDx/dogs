import Router from 'next/router';

export default () => {
  let dogs = [
    {
      _id: 1,
      name: 'Dog 1'
    },
    {
      _id: 2,
      name: 'Dog 2'
    }
  ]

  return (
    <div>
      <button onClick={(e) => {
        Router.push('/cadDog');
      }}>cadastro</button>
      <ul>
        {
          dogs.map((dog, index) => {
            return (
              <li key={dog._id}>{dog.name}</li>
            )
          })
        }
      </ul>
    </div>
  )
}