import chai from 'chai'
import convert from './index'

const { expect } = chai;

describe('convert', function() {
  it('converts class, default export', function() {
    const input = `export default class Foo extends React.Component {
render() {
  const { foo, bar } = this.props;
    return (
      <div>
        This is {foo} {bar}
      </div>
    )
  }
}`;

    const output = convert(input)

    expect(output).to.equal(`export defult ({foo, bar}) => {
  return (
    <div>
      This is {foo} {bar}
    </div>
  )
}`)
  })
})
