import chai from 'chai'
import convert from './index'

describe('foo', function() {
  it('does bar', function() {
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

    console.log(output)
  })
})
