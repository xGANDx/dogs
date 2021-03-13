import Router from "next/router"

export default () => {

  return (
    <div>
      <button onClick={() => {
          Router.back();
      }}>voltar</button>
      cadastro dog !!!!
    </div>
  )
}